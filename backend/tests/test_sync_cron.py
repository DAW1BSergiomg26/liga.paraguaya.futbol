import pytest
from unittest.mock import patch, MagicMock
from backend.app.services.football_data_service import FootballDataService

def test_sync_all_calls_fetch():
    with patch.object(FootballDataService, 'fetch_partidos') as mock_fetch:
        mock_fetch.return_value = []
        with patch.object(FootballDataService, 'fetch_tabla') as mock_tabla:
            mock_tabla.return_value = []
            with patch.object(FootballDataService, 'fetch_goleadores') as mock_goleadores:
                mock_goleadores.return_value = []
                result = FootballDataService.sync_all()
                assert mock_fetch.called
                assert mock_tabla.called
                assert mock_goleadores.called
