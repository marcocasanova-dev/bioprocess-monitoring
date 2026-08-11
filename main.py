import time

from biospectrometer import Biospectrometer, read_csv_file


def main():
    df = read_csv_file()
    bio_spectrometer = Biospectrometer(df)
    bio_spectrometer.start_simulation()
    time.sleep(2)
    bio_spectrometer.stop_simulation()
    print("stop")
    time.sleep(2)
    bio_spectrometer.jump_to(22)
    print(f"jump {bio_spectrometer.get_current_data()[0]}")
    bio_spectrometer.start_simulation()
    print("RESUMED")
    time.sleep(2)
    bio_spectrometer.get_current_data()


if __name__ == "__main__":
    main()
