# ==============================================================================
# File: backend/utils.py (FINAL & CORRECTED)
# Description: This version uses a simplified, temporary scoring logic for
# demonstration purposes, awarding full points for each activity logged.
# ==============================================================================
from sqlalchemy.orm import Session, joinedload
from . import models

def calculate_leaderboard_scores(db: Session, campaign_id: int) -> list:
    """
    Calculates the leaderboard scores for individual team members using automated logic.
    """
    employees = db.query(models.Employee).filter(
        models.Employee.role.notin_([
            'Admin', 'admin', 
            'BA Head', 'ba_coordinator', 
            'Team Coordinator', 'team_coordinator'
        ])
    ).all()
    
    final_scores = []

    all_activities = db.query(models.Activity).filter(models.Activity.campaign_id == campaign_id).all()
    all_scoring_weights = db.query(models.ScoringWeight).filter(models.ScoringWeight.campaign_id == campaign_id).all()
    all_team_targets = db.query(models.TeamTarget).filter(models.TeamTarget.campaign_id == campaign_id).all()
    activity_types_query = db.query(models.ActivityType).all()
    
    activity_types = {at.name: at.id for at in activity_types_query}
    activity_type_names = {at.id: at.name for at in activity_types_query}
    weights_by_type_name = {activity_type_names.get(sw.activity_type_id): sw for sw in all_scoring_weights}

    for emp in employees:
        if not emp.team or emp.team.campaign_id != campaign_id:
            continue
        
        total_score = 0
        emp_activities = [act for act in all_activities if act.employee_id == emp.id]
        if not emp_activities:
            continue

        emp_team_targets = [t for t in all_team_targets if t.team_id == emp.team_id]
        targets_by_type_id = {t.activity_type_id: t for t in emp_team_targets}

        activities_by_type_id = {}
        for act in emp_activities:
            type_id = act.activity_type_id
            if type_id not in activities_by_type_id:
                activities_by_type_id[type_id] = 0
            activities_by_type_id[type_id] += 1

        # --- TEMPORARY DEMO SCORING LOGIC ---

        target_based_metrics = ["MNP", "SIM Sales", "SIM Upgradation", "FTTH", "House Visit"]
        
        for metric_name in target_based_metrics:
            metric_id = activity_types.get(metric_name)
            metric_achieved = activities_by_type_id.get(metric_id, 0)
            metric_weight = weights_by_type_name.get(metric_name)

            if metric_achieved > 0 and metric_weight:
                # This awards the full max_marks for each activity logged.
                # Example: Logging 2 SIM Sales gives 2 * 20 = 40 points.
                score = metric_achieved * metric_weight.max_marks
                
                

                total_score += score

        final_scores.append({
            "employee_id": emp.id,
            "employee_name": emp.name,
            "team_id": emp.team_id,
            "team_name": emp.team.name if emp.team else "N/A",
            "ba_name": emp.team.business_area.name if emp.team and emp.team.business_area else "N/A",
            "total_score": round(total_score)
        })
    
    return sorted(final_scores, key=lambda x: x['total_score'], reverse=True)

def calculate_team_leaderboard_scores(db: Session, campaign_id: int) -> list:
    """
    Calculates leaderboard scores by aggregating individual employee scores for each team.
    """
    employee_scores = calculate_leaderboard_scores(db, campaign_id)
    team_scores = {}

    for score in employee_scores:
        team_id = score.get('team_id')
        if not team_id: continue

        if team_id not in team_scores:
            team_obj = db.query(models.Team).options(joinedload(models.Team.business_area)).get(team_id)
            if not team_obj: continue
            
            team_scores[team_id] = {
                "team_id": team_id,
                "team_name": team_obj.name,
                "team_code": team_obj.team_code,
                "ba_name": team_obj.business_area.name,
                "total_score": 0
            }
        
        team_scores[team_id]['total_score'] += score['total_score']

    return sorted(list(team_scores.values()), key=lambda x: x['total_score'], reverse=True)


def calculate_ba_leaderboard_scores(db: Session, campaign_id: int) -> list:
    """
    Calculates leaderboard scores by aggregating team scores for each Business Area.
    """
    team_scores = calculate_team_leaderboard_scores(db, campaign_id)
    ba_scores = {}

    for score in team_scores:
        team_obj = db.query(models.Team).options(joinedload(models.Team.business_area)).get(score['team_id'])
        if not team_obj or not team_obj.business_area: continue

        ba_id = team_obj.ba_id
        if ba_id not in ba_scores:
            ba_head = db.query(models.Employee).filter(
                models.Employee.team.has(models.Team.ba_id == ba_id),
                models.Employee.role.in_(['BA Head', 'ba_coordinator'])
            ).first()

            ba_scores[ba_id] = {
                "ba_id": ba_id,
                "ba_name": team_obj.business_area.name,
                "coordinator_name": ba_head.name if ba_head else "N/A",
                "total_score": 0
            }
        
        ba_scores[ba_id]['total_score'] += score['total_score']
    
    return sorted(list(ba_scores.values()), key=lambda x: x['total_score'], reverse=True)
