import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket, type BoardChangedPayload } from '@/shared/api';
import { boardQueryKey } from '../model/keys';

const JOIN_ACK_TIMEOUT_MS = 5000;

export const useBoardChangesWs = (boardId: string | undefined) => {
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!boardId) return;

        const socket = getSocket();

        const invalidateBoard = () => {
            void queryClient.invalidateQueries({ queryKey: boardQueryKey(boardId) });
        };

        const join = () => {
            socket
                .timeout(JOIN_ACK_TIMEOUT_MS)
                .emitWithAck('board:join', { boardId })
                .catch((error) => {
                    console.error(error);
                });
        };

        const handleConnect = () => {
            join();
            invalidateBoard();
        };

        const handleBoardChanged = (payload: BoardChangedPayload) => {
            if (payload.boardId !== boardId) return;
            invalidateBoard();
        };

        socket.on('connect', handleConnect);
        socket.on('board:changed', handleBoardChanged);

        if (socket.connected) {
            join();
        } else {
            socket.connect();
        }

        return () => {
            socket.off('connect', handleConnect);
            socket.off('board:changed', handleBoardChanged);
        };
    }, [boardId, queryClient]);
};
