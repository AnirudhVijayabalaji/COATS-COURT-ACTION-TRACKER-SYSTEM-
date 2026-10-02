_processing: dict[str, dict] = {}


def initialize(case_id: str) -> None:
    _processing[case_id] = {"done": False}


def get_processing_state(case_id: str) -> dict:
    return _processing.get(case_id, {})


def set_step(case_id: str, step: str, done: bool) -> None:
    if case_id not in _processing:
        initialize(case_id)
    _processing[case_id][step] = done


def set_done(case_id: str) -> None:
    if case_id not in _processing:
        initialize(case_id)
    _processing[case_id]["done"] = True


def set_error(case_id: str, message: str) -> None:
    if case_id not in _processing:
        initialize(case_id)
    _processing[case_id]["error"] = message
