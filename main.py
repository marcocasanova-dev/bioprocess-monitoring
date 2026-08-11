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

    def _run_simulation(self):
        while True:
            while self.stop_event.is_set():
                time.sleep(0.1)
            time.sleep(0.5)
            print(f"start_simulation INDEX --> {self.current_index}")
            self.current_index += 1

    def start_simulation(self):
        if self.thread is None:
            self.thread = threading.Thread(target=self._run_simulation)
            self.thread.start()
            print("start")
        self.stop_event.clear()

    def stop_simulation(self):
        self.stop_event.set()

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
    bio_spectrometer.stop_simulation()
    print(bio_spectrometer.get_current_data())
    time.sleep(2)
    print(bio_spectrometer.get_current_data())
    time.sleep(3)
    print(bio_spectrometer.get_current_data())
    time.sleep(1)
    print("START")
    print(bio_spectrometer.start_simulation())
    time.sleep(1)


if __name__ == "__main__":
    main()
