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
        self.pause_event = threading.Event()

    def _run_simulation(self):
        while not self.stop_event.is_set():
            time.sleep(0.5)
            print(f"start_simulation is on in idx{self.current_index}")
            self.current_index += 1

    def start_simulation(self):
        self.thread = threading.Thread(target=self._run_simulation)
        self.thread.start()
        print("start")

    def pause_simulation(self):
        print("pause")

    def resume_simulation(self):
        print("resume")

    def kill_simulation(self):
        print("kill")

    def get_current_data(self):
        return self.current_index, self.data.loc[self.current_index]

    def jump_to(self, to_index):
        print("jump to this index")


def read_csv_file():
    csv_file_path = Path(__file__).parent / "data" / "spectra.csv"
    df = pd.read_csv(csv_file_path, index_col=0)
    df.columns = df.columns.astype(int)
    return df


def main():
    df = read_csv_file()
    # print(df.shape)
    # print(df.head())
    print(df.head())
    print(df.loc[3, 1002])

    bio_spectrometer = Biospectrometer(df)
    bio_spectrometer.start_simulation()
    print("----------------------------------")
    print(bio_spectrometer.get_current_data())


if __name__ == "__main__":
    main()
