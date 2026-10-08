from celery_app import celery_app
from services.processing_service import process_case


@celery_app.task(name="process_case_task")
def process_case_task(case_id: str):
    process_case(case_id)
    return {"case_id": case_id, "status": "completed"}
