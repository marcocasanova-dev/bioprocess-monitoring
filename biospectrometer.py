from pathlib import Path

import pandas as pd

import threading

import time


class Biospectrometer:
    def __init__(self, data):
        self.data = data
        self.current_index = 0
        self.thread = None
        self.stop_event = threading.Event()
        self.lock = threading.Lock()

    def _run_simulation(self):
        while True:
            while self.stop_event.is_set():
                time.sleep(0.1)
            time.sleep(0.5)
            with self.lock:
                self.current_index = (self.current_index + 1) % len(self.data)

    def start_simulation(self):
        if self.thread is None:
            self.thread = threading.Thread(target=self._run_simulation, daemon=True)
            self.thread.start()
        self.stop_event.clear()

    def stop_simulation(self):
        self.stop_event.set()

    def is_running(self):
        return self.thread is not None and not self.stop_event.is_set()

    def get_current_data(self):
        with self.lock:
            return self.current_index, self.data.loc[self.current_index]

    def jump_to(self, to_index):
        max_index = len(self.data) - 1
        if to_index < 0 or to_index > max_index:
            raise ValueError(f"index out of range min: 0 max: {max_index} ")
        with self.lock:
            self.current_index = to_index


def read_csv_file(device_id: str = "monipa-01"):
    csv_file_path = Path(__file__).parent / "data" / f"{device_id}.csv"
    df = pd.read_csv(csv_file_path, index_col=0)
    df.columns = df.columns.astype(int)
    return df
