import pytest

from biospectrometer import Biospectrometer, read_csv_file


def test_jump_to_last_valid():
    df = read_csv_file()
    spectrometer = Biospectrometer(df)
    last_valid_index = len(df) - 1
    spectrometer.jump_to(last_valid_index)

    assert spectrometer.current_index == last_valid_index


def test_jump_to_negative_index():
    df = read_csv_file()
    spectrometer = Biospectrometer(df)

    with pytest.raises(ValueError):
        spectrometer.jump_to(-1)
