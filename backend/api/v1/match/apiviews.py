from rest_framework.views import APIView
from rest_framework.status import (
    HTTP_404_NOT_FOUND,
    HTTP_400_BAD_REQUEST,
    HTTP_200_OK
)
from rest_framework.response import Response
from apps.core.utils import get_all_matches, get_match_by_id
from apps.core.serializers import MatchSerializer, PlayerProfileSerializer

class MatchView(APIView):
    def get(self, request, match_id=None):
        if match_id:
            match = get_match_by_id(match_id)
            if not match:
                return Response({'error': 'Match not found'}, status=HTTP_404_NOT_FOUND)
            serializer = MatchSerializer(match)
            return Response(serializer.data, status=HTTP_200_OK)
        else:
            matches = get_all_matches()
            serializer = MatchSerializer(matches, many=True)
            return Response(serializer.data, status=HTTP_200_OK)

