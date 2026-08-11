from pathlib import Path

import pandas as pd


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


if __name__ == "__main__":
    main()
