import { FC, FormEvent, useEffect, useRef, useState } from "react";

import { ActionButton } from "@/components/Controls";
import {
  BoardBlock, BoardForm, BoardLabel, BoardList, BoardNote, BoardRow, BoardTitle, InitialsInput,
} from "@/components/Finale/Voyage/Board/DailyBoard.styles";
import { readStored, writeStored } from "@/packages/browser/storage";
import type { BoardView } from "@/packages/games/daily-board";
import { BOARD } from "@/packages/games/daily-board";
import { fill, formatNumber } from "@/packages/text/format";
import { fetchBoard, postRun } from "@/services/voyage/board/client";
import { FinaleVoyage } from "@/types/game";

interface DailyBoardProps {
  content: FinaleVoyage;
  day: string;
  score: number;
}

// The best this browser has put on a day's board, so the same run is not offered twice.
const SENT_KEY = "redgame.voyageBoard";
const isSent = (value: unknown): value is { day: string; score: number } => typeof value === "object" && value !== null && "day" in value &&
  "score" in value && typeof value.day === "string" && typeof value.score === "number";

// The daily voyage's board under a day's run: the best runs of the day (initials and score, nothing else), and the
// pilot's own run offered to it with the initials they choose, saying plainly what is kept. Nothing is sent unless
// they ask.
export const DailyBoard: FC<DailyBoardProps> = ({ content, day, score }) => {
  const copy = content.board;
  const [board, setBoard] = useState<BoardView | null | "loading">("loading");
  const [initials, setInitials] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [rank, setRank] = useState<number | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sentScore, setSentScore] = useState(0);
  // Where focus goes once the run is on the board and the form is gone: the board itself.
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    let isLive = true;
    const sent = readStored(SENT_KEY, isSent);

    setSentScore(sent?.day === day ? sent.score : 0);
    void fetchBoard(day).then((view) => {
      if (isLive) {
        setBoard(view);
      }
    });

    return () => {
      isLive = false;
    };
  }, [day]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    const clean = initials.trim().toUpperCase();

    if (!BOARD.initials.test(clean)) {
      setMessage(copy.invalid);

      return;
    }

    setIsSending(true);

    const result = await postRun(day, clean, score);

    setIsSending(false);

    if (result === "busy" || result === null) {
      setMessage(result === "busy" ? copy.busy : copy.failed);

      return;
    }

    setBoard(result);
    setRank(result.rank);
    setSentScore(score);
    writeStored(SENT_KEY, { day, score });
    setMessage(result.rank ? fill(copy.sent, { rank: result.rank }) : fill(copy.sentOff, { size: BOARD.size }));
    window.requestAnimationFrame(() => listRef.current?.focus());
  };

  const canSend = score > 0 && score > sentScore && rank === null;

  return (
    <BoardBlock aria-labelledby="board-title">
      <BoardTitle id="board-title">{copy.title}</BoardTitle>
      {board === "loading" && <BoardNote>{copy.loading}</BoardNote>}
      {board === null && <BoardNote>{copy.resting}</BoardNote>}
      {board !== "loading" && board !== null && (board.entries.length === 0 ? <BoardNote>{copy.empty}</BoardNote> : (
        <BoardList ref={listRef} tabIndex={-1} aria-label={copy.title}>
          {board.entries.map((entry, index) => (
            <BoardRow key={`${entry.initials}-${index}`} isMine={rank === index + 1}>
              <span>{`${index + 1}. ${entry.initials}`}</span>
              <span>{formatNumber(entry.score)}</span>
            </BoardRow>
          ))}
        </BoardList>
      ))}
      {canSend && board !== null && (
        <BoardForm onSubmit={(event) => void submit(event)}>
          <BoardLabel>
            {copy.initials}
            <InitialsInput
              value={initials}
              maxLength={3}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              onChange={(event) => setInitials(event.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase())}
            />
          </BoardLabel>
          <ActionButton type="submit" isPrimary disabled={isSending || initials.length === 0}>{copy.submit}</ActionButton>
        </BoardForm>
      )}
      <BoardNote role="status">{message ?? ""}</BoardNote>
      {canSend && board !== null && <BoardNote>{copy.privacy}</BoardNote>}
    </BoardBlock>
  );
};
