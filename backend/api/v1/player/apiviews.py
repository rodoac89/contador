from rest_framework.views import APIView
from rest_framework.status import (
    HTTP_404_NOT_FOUND,
    HTTP_400_BAD_REQUEST,
    HTTP_200_OK
)
from rest_framework.response import Response
from apps.core.utils import add_player, get_player, get_all_players
from apps.core.serializers import PlayerProfileSerializer

class PlayerApiView(APIView):
    """
    API view to handle player retrieval and creation.
    """
    def get(self, request, player_name=None, *args, **kwargs):
        
        if player_name is None:
            players = get_all_players()
            serializer = PlayerProfileSerializer(players, many=True)
            return Response(serializer.data, status=HTTP_200_OK)

        elif player_name is not None:

            player = get_player(player_name)
            if player is None:
                return Response(
                    {"detail": "Player not found."},
                    status=HTTP_404_NOT_FOUND
                )

            serializer = PlayerProfileSerializer(player)
            return Response(serializer.data, status=HTTP_200_OK)

    def post(self, request, *args, **kwargs):
        player_name = request.data.get('player_name')
        if not player_name:
            return Response(
                {"detail": "Player name is required."},
                status=HTTP_400_BAD_REQUEST
            )

        existing_player = get_player(player_name)
        if existing_player is not None:
            return Response(
                {"detail": "Player already exists."},
                status=HTTP_400_BAD_REQUEST
            )

        new_player = add_player(player_name)
        serializer = PlayerProfileSerializer(new_player)
        return Response(serializer.data, status=HTTP_200_OK)

