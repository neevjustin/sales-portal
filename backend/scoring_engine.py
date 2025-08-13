# ==============================================================================
# File: backend/scoring_engine.py (Corrected and Final Version)
# Description: This version calculates scores for BAs, Teams, and Individuals.
# ==============================================================================
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from . import models

def _get_targets(db: Session, campaign_id: int) -> dict:
    """Fetches all team and BA targets for a campaign."""
    targets = {}
    team_targets = db.query(models.TeamTarget).filter(models.TeamTarget.campaign_id == campaign_id).all()
    for t in team_targets:
        targets[('team', t.team_id, t.activity_type_id)] = t.target_value
    
    ba_targets = db.query(models.BATarget).filter(models.BATarget.campaign_id == campaign_id).all()
    for t in ba_targets:
        targets[('ba', t.ba_id, t.activity_type_id)] = t.target_value
        
    return targets

def _get_activity_counts(db: Session, campaign_id: int) -> dict:
    """Gets counts of all activities, grouped by team and activity type."""
    counts = {}
    results = db.query(
        models.Activity.team_id,
        models.Activity.activity_type_id,
        func.count(models.Activity.id)
    ).filter(models.Activity.campaign_id == campaign_id).group_by(
        models.Activity.team_id,
        models.Activity.activity_type_id
    ).all()
    
    for team_id, activity_type_id, count in results:
        counts[(team_id, activity_type_id)] = count
        
    return counts

def _calculate_proportional_score(achieved: int, target: int, max_points: float) -> float:
    """Calculates score based on percentage achievement. Caps at max_points."""
    if target == 0:
        # If there's no target, give full points for any achievement, otherwise zero.
        return max_points if achieved > 0 else 0.0
    
    proportion = achieved / target
    score = proportion * max_points
    
    # Ensure score does not exceed the maximum allowed points.
    return min(score, max_points)

def recalculate_all_scores(db: Session, campaign_id: int):
    """
    The main function to orchestrate the entire scoring process for a campaign.
    """
    print(f"Starting score recalculation for campaign {campaign_id}...")

    # Clear out all previous scores for this campaign to start fresh
    db.query(models.Score).filter(models.Score.campaign_id == campaign_id).delete()
    db.commit()

    # --- 1. Fetch all necessary data upfront for efficiency ---
    teams = db.query(models.Team).filter(models.Team.campaign_id == campaign_id).all()
    employees = db.query(models.Employee).all()
    activity_types = {at.name: at.id for at in db.query(models.ActivityType).all()}
    targets = _get_targets(db, campaign_id)
    activity_counts = _get_activity_counts(db, campaign_id)

    all_scores_to_save = []
    
    # --- 2. Calculate Team-Level Scores ---
    team_scores_list = []
    for team in teams:
        target_metrics = { 
            "MNP": 30.0, 
            "4G SIM Upgradation": 5.0, 
            "BNU connections": 10.0, 
            "Urban connections": 5.0 
        }
        for name, max_points in target_metrics.items():
            activity_type_id = activity_types.get(name)
            if not activity_type_id: continue
            achieved = activity_counts.get((team.id, activity_type_id), 0)
            target = targets.get(('team', team.id, activity_type_id), 0)
            points = _calculate_proportional_score(achieved, target, max_points)
            team_scores_list.append(models.Score(campaign_id=campaign_id, entity_id=team.id, entity_type='team', parameter=name, points=points))

        sim_sales_id = activity_types.get("SIM Sales")
        if sim_sales_id:
            achieved = activity_counts.get((team.id, sim_sales_id), 0)
            target = targets.get(('team', team.id, sim_sales_id), 0)
            points = _calculate_proportional_score(achieved, target, 20.0)
            team_scores_list.append(models.Score(campaign_id=campaign_id, entity_id=team.id, entity_type='team', parameter="SIM Sales", points=points))
        
        total_employees_in_team = len([e for e in employees if e.team_id == team.id])
        if total_employees_in_team > 0:
            participating_employees = db.query(func.count(func.distinct(models.Activity.employee_id))).filter(models.Activity.team_id == team.id, models.Activity.campaign_id == campaign_id).scalar() or 0
            involvement_points = _calculate_proportional_score(participating_employees, total_employees_in_team, 10.0)
            team_scores_list.append(models.Score(campaign_id=campaign_id, entity_id=team.id, entity_type='team', parameter="Employee involvement", points=involvement_points))
        
        mela_count = db.query(func.count(models.Mela.id)).filter(models.Mela.team_id == team.id, models.Mela.campaign_id == campaign_id).scalar() or 0
        mela_target = 10 # Assuming a static target for demonstration
        mela_points = _calculate_proportional_score(mela_count, mela_target, 4.0)
        team_scores_list.append(models.Score(campaign_id=campaign_id, entity_id=team.id, entity_type='team', parameter="No of Melas", points=mela_points))
    
    all_scores_to_save.extend(team_scores_list)

    # --- 3. Aggregate Team Scores to BAs & Apply BA Rules ---
    ba_scores_map = {}
    for score in team_scores_list:
        if score.entity_type == 'team':
            team = next((t for t in teams if t.id == score.entity_id), None)
            if team:
                ba_id = team.ba_id
                param = score.parameter
                if ba_id not in ba_scores_map: ba_scores_map[ba_id] = {}
                if param not in ba_scores_map[ba_id]: ba_scores_map[ba_id][param] = 0.0
                ba_scores_map[ba_id][param] += score.points
    
    final_ba_scores = []
    for ba_id, params in ba_scores_map.items():
        sim_sales_id = activity_types.get("SIM Sales")
        if sim_sales_id and "SIM Sales" in params:
            ba_target = targets.get(('ba', ba_id, sim_sales_id), 0)
            total_ba_achieved = sum(activity_counts.get((t.id, sim_sales_id), 0) for t in teams if t.ba_id == ba_id)
            if ba_target > 0 and (total_ba_achieved / ba_target) < 0.40:
                params["SIM Sales"] = 0.0
        
        for param, points in params.items():
             final_ba_scores.append(models.Score(campaign_id=campaign_id, entity_id=ba_id, entity_type='ba', parameter=param, points=points))
    
    all_scores_to_save.extend(final_ba_scores)

    # --- 4. BA-Level Event & Bonus Scoring ---
    business_areas = db.query(models.BusinessArea).all()
    for ba in business_areas:
        event_count = db.query(func.count(models.SpecialEvent.id)).filter(models.SpecialEvent.ba_id == ba.id, models.SpecialEvent.campaign_id == campaign_id).scalar()
        if event_count > 0:
            all_scores_to_save.append(models.Score(campaign_id=campaign_id, entity_id=ba.id, entity_type='ba', parameter="Special Events", points=5.0))

        release_count = db.query(func.count(models.PressRelease.id)).filter(models.PressRelease.ba_id == ba.id, models.PressRelease.campaign_id == campaign_id).scalar()
        if release_count >= 3:
            all_scores_to_save.append(models.Score(campaign_id=campaign_id, entity_id=ba.id, entity_type='ba', parameter="Bonus Points", points=15.0))
            
    # --- 5. Delayed Scoring: House Visits & Leads (Aggregates to Team) ---
    employees_with_leads = db.query(models.Employee).join(models.Activity).filter(
        models.Activity.campaign_id == campaign_id,
        models.Activity.is_lead == True
    ).distinct().all()

    for emp in employees_with_leads:
        total_leads = db.query(func.count(models.Activity.id)).filter_by(employee_id=emp.id, campaign_id=campaign_id, is_lead=True).scalar() or 0
        converted_leads = db.query(func.count(models.Activity.id)).filter_by(employee_id=emp.id, campaign_id=campaign_id, is_lead=True, is_converted=True).scalar() or 0

        if total_leads > 0 and (converted_leads / total_leads) >= 0.10:
            if emp.team_id:
                all_scores_to_save.append(models.Score(campaign_id=campaign_id, entity_id=emp.team_id, entity_type='team', parameter="No of Houses visited", points=4.0))
                all_scores_to_save.append(models.Score(campaign_id=campaign_id, entity_id=emp.team_id, entity_type='team', parameter="BNU leads", points=1.0))
                all_scores_to_save.append(models.Score(campaign_id=campaign_id, entity_id=emp.team_id, entity_type='team', parameter="Urban leads", points=1.0))
    
    # --- 6. Calculate Individual Employee Scores (Direct Points) ---
    point_values = {
        "MNP": 30.0, "SIM Sales": 20.0, "4G SIM Upgradation": 5.0, 
        "BNU connections": 10.0, "Urban connections": 5.0, "House Visit": 4.0
    }
    
    employee_activities = db.query(
        models.Activity.employee_id,
        models.ActivityType.name,
        func.count(models.Activity.id).label("count")
    ).join(models.ActivityType).filter(
        models.Activity.campaign_id == campaign_id
    ).group_by(
        models.Activity.employee_id,
        models.ActivityType.name
    ).all()

    for emp_id, activity_name, count in employee_activities:
        points = point_values.get(activity_name, 0) * count
        if points > 0:
            all_scores_to_save.append(models.Score(
                campaign_id=campaign_id,
                entity_id=emp_id,
                entity_type='employee',
                parameter=activity_name,
                points=points
            ))

    # --- 7. Bulk Save to Database ---
    if all_scores_to_save:
        db.bulk_save_objects(all_scores_to_save)
        
    db.commit()
    print(f"Score recalculation complete. {len(all_scores_to_save)} score entries created.")



def update_score_for_employee(db: Session, employee_id: int, campaign_id: int):
    """
    Calculates and updates the score for a single employee based on their activities.
    This is a lightweight function designed to be called in real-time.
    """
    print(f"Running incremental score update for employee {employee_id}...")
    
    # Point values for direct scoring
    point_values = {
        "MNP": 30.0, "SIM Sales": 20.0, "4G SIM Upgradation": 5.0,
        "BNU connections": 10.0, "Urban connections": 5.0, "House Visit": 4.0
    }

    # Get all relevant activities for this employee
    employee_activities = db.query(
        models.ActivityType.name,
        func.count(models.Activity.id).label("count")
    ).join(models.ActivityType).filter(
        models.Activity.campaign_id == campaign_id,
        models.Activity.employee_id == employee_id
    ).group_by(models.ActivityType.name).all()

    # Delete previous score entries for this employee to prevent duplicates
    db.query(models.Score).filter(
        models.Score.campaign_id == campaign_id,
        models.Score.entity_id == employee_id,
        models.Score.entity_type == 'employee'
    ).delete(synchronize_session=False)

    # Create new score entries
    new_scores = []
    for activity_name, count in employee_activities:
        points = point_values.get(activity_name, 0) * count
        if points > 0:
            new_scores.append(models.Score(
                campaign_id=campaign_id,
                entity_id=employee_id,
                entity_type='employee',
                parameter=activity_name,
                points=points
            ))
    
    if new_scores:
        db.bulk_save_objects(new_scores)
    
    db.commit()
    print(f"Incremental update complete for employee {employee_id}.")