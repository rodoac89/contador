from rest_framework.views import APIView
from rest_framework.status import (
    HTTP_404_NOT_FOUND,
    HTTP_400_BAD_REQUEST,
    HTTP_200_OK
)
from rest_framework.response import Response
from apps.core.utils import create_match, delete_match, get_all_matches, get_match_by_id, get_matches_record
from apps.core.serializers import MatchSerializer

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
    
    def post(self, request):
        match = create_match(request.data.get('id'), request.data.get('playerScores'))
        if not match:
            return Response({'error': 'Failed to create match'}, status=HTTP_400_BAD_REQUEST)
        serializer = MatchSerializer(match)
        return Response(serializer.data, status=HTTP_200_OK)
    
    def delete(self, request, match_id):
        match = get_match_by_id(match_id)
        if not match:
            return Response({'error': 'Match not found'}, status=HTTP_404_NOT_FOUND)
        delete_success = delete_match(match_id)
        if not delete_success:
            return Response({'error': 'Failed to delete match'}, status=HTTP_400_BAD_REQUEST)
        return Response(status=HTTP_200_OK)


class MatchRecordView(APIView):
    def get(self, request):
        matches_record = get_matches_record()
        return Response(matches_record, status=HTTP_200_OK)