from pathlib import Path

import pandas as pd


class Biospectrometer:
    def __init__(self, data):
        self.data = data
        self.current_index = 0

    def start(self):
        print("start")

    def pause(self):
        print("pause")

    def resume(self):
        print("resume")

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
    bio_spectrometer.start()
    print("----------------------------------")
    print(bio_spectrometer.get_current_data())


if __name__ == "__main__":
    main()
