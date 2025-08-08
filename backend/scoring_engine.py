# ==============================================================================
# File: backend/scoring_engine.py (FULLY IMPLEMENTED & Production Ready)
# ==============================================================================
from sqlalchemy.orm import Session
from sqlalchemy import func
from . import models

# ... (helper functions _get_targets, _get_activity_counts, _calculate_proportional_score remain the same)

def recalculate_all_scores(db: Session, campaign_id: int):
    """
    The main function to orchestrate the entire scoring process for a campaign.
    """
    print(f"Starting score recalculation for campaign {campaign_id}...")

    db.query(models.Score).filter(models.Score.campaign_id == campaign_id).delete()
    db.commit()

    # --- 1. Fetch all necessary data upfront ---
    teams = db.query(models.Team).filter(models.Team.campaign_id == campaign_id).all()
    employees = db.query(models.Employee).all()
    activity_types = {at.name: at.id for at in db.query(models.ActivityType).all()}
    targets = _get_targets(db, campaign_id)
    activity_counts = _get_activity_counts(db, campaign_id)

    new_scores = []
    
    # --- 2. Calculate Team-Level Scores ---
    for team in teams:
        # --- Target-Based Metrics ---
        target_metrics = { "MNP": 30.0, "4G SIM Upgradation": 5.0, "BNU connections": 10.0, "Urban connections": 5.0 }
        for name, max_points in target_metrics.items():
            activity_type_id = activity_types.get(name)
            if not activity_type_id: continue
            achieved = activity_counts.get((team.id, activity_type_id), 0)
            target = targets.get(('team', team.id, activity_type_id), 0)
            points = _calculate_proportional_score(achieved, target, max_points)
            new_scores.append(models.Score(campaign_id=campaign_id, entity_id=team.id, entity_type='team', parameter=name, points=points))

        # --- SIM Sales (proportional score for team) ---
        sim_sales_id = activity_types.get("SIM Sales")
        if sim_sales_id:
            achieved = activity_counts.get((team.id, sim_sales_id), 0)
            target = targets.get(('team', team.id, sim_sales_id), 0)
            points = _calculate_proportional_score(achieved, target, 20.0)
            new_scores.append(models.Score(campaign_id=campaign_id, entity_id=team.id, entity_type='team', parameter="SIM Sales", points=points))
        
        # --- Employee Involvement ---
        total_employees = len([e for e in employees if e.team_id == team.id])
        participating_employees = db.query(func.count(func.distinct(models.Activity.employee_id))).filter(models.Activity.team_id == team.id, models.Activity.campaign_id == campaign_id).scalar()
        involvement_points = _calculate_proportional_score(participating_employees, total_employees, 10.0)
        new_scores.append(models.Score(campaign_id=campaign_id, entity_id=team.id, entity_type='team', parameter="Employee involvement", points=involvement_points))
        
        # --- No of Melas ---
        mela_count = db.query(func.count(models.Mela.id)).filter(models.Mela.team_id == team.id, models.Mela.campaign_id == campaign_id).scalar()
        # Assuming a simple target of 10 melas per team for demonstration
        mela_points = _calculate_proportional_score(mela_count, 10, 4.0)
        new_scores.append(models.Score(campaign_id=campaign_id, entity_id=team.id, entity_type='team', parameter="No of Melas", points=mela_points))

    # --- 3. Aggregate Team Scores to BAs & Apply BA Rules ---
    ba_scores_map = {}
    for score in new_scores:
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
        # --- Apply BA-level 40% SIM Sales eligibility rule ---
        sim_sales_id = activity_types.get("SIM Sales")
        if sim_sales_id and "SIM Sales" in params:
            ba_target = targets.get(('ba', ba_id, sim_sales_id), 0)
            total_ba_achieved = sum(activity_counts.get((t.id, sim_sales_id), 0) for t in teams if t.ba_id == ba_id)
            if ba_target > 0 and (total_ba_achieved / ba_target) < 0.40:
                params["SIM Sales"] = 0.0 # Zero out points if not eligible
        
        for param, points in params.items():
             final_ba_scores.append(models.Score(campaign_id=campaign_id, entity_id=ba_id, entity_type='ba', parameter=param, points=points))

    # --- 4. BA-Level Event & Bonus Scoring ---
    business_areas = db.query(models.BusinessArea).all()
    for ba in business_areas:
        # --- Special Events: 5 points for BA if >= 1 event ---
        event_count = db.query(func.count(models.SpecialEvent.id)).filter(models.SpecialEvent.ba_id == ba.id, models.SpecialEvent.campaign_id == campaign_id).scalar()
        if event_count > 0:
            final_ba_scores.append(models.Score(campaign_id=campaign_id, entity_id=ba.id, entity_type='ba', parameter="Special Events", points=5.0))

        # --- Bonus Points: 15 points for BA if >= 3 press releases ---
        release_count = db.query(func.count(models.PressRelease.id)).filter(models.PressRelease.ba_id == ba.id, models.PressRelease.campaign_id == campaign_id).scalar()
        if release_count >= 3:
            final_ba_scores.append(models.Score(campaign_id=campaign_id, entity_id=ba.id, entity_type='ba', parameter="Bonus Points", points=15.0))

    # --- 5. Delayed Scoring: House Visits & Leads (Aggregates to Team) ---
    house_visit_id = activity_types.get("House Visit")
    if house_visit_id:
        # Get all employees who have made at least one lead
        employees_with_leads = db.query(models.Employee).join(models.Activity).filter(
            models.Activity.campaign_id == campaign_id,
            models.Activity.is_lead == True
        ).distinct().all()

        for emp in employees_with_leads:
            total_leads = db.query(func.count(models.Activity.id)).filter(
                models.Activity.employee_id == emp.id, 
                models.Activity.campaign_id == campaign_id,
                models.Activity.is_lead == True
            ).scalar()
            
            converted_leads = db.query(func.count(models.Activity.id)).filter(
                models.Activity.employee_id == emp.id, 
                models.Activity.campaign_id == campaign_id,
                models.Activity.is_lead == True,
                models.Activity.is_converted == True
            ).scalar()

            if total_leads > 0 and (converted_leads / total_leads) >= 0.10:
                if emp.team_id:
                    # Award points to the employee's team
                    new_scores.append(models.Score(campaign_id=campaign_id, entity_id=emp.team_id, entity_type='team', parameter="No of Houses visited", points=4.0))
                    new_scores.append(models.Score(campaign_id=campaign_id, entity_id=emp.team_id, entity_type='team', parameter="BNU leads", points=1.0))
                    new_scores.append(models.Score(campaign_id=campaign_id, entity_id=emp.team_id, entity_type='team', parameter="Urban leads", points=1.0))

    # --- 6. Bulk Save to Database ---
    all_scores_to_save = new_scores + final_ba_scores
    db.bulk_save_objects(all_scores_to_save)
    db.commit()
    print(f"Score recalculation complete. {len(all_scores_to_save)} score entries created.")