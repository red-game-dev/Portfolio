import { useEffect, useState } from "react";

export const useType = (typingData: string[]) => {
  const [letters, setLetter] = useState<string[]>([]);
  const [canReverse, setCanReverse] = useState<boolean>(false);
  const [currentTitleId, setCurrentTitleId] = useState<number>(0);

  useEffect(() => {
    setLetter([]);
    setCanReverse(false);
  }, [currentTitleId]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      // Replaced all tags
      const title = (typingData[currentTitleId] || "")
                      .replaceAll(/<([a-z]+)?>/g, ":")
                      .replaceAll(/<\/([a-z]+)?>/g, ";");

      if (title) {
        const nextLetter = title.slice(letters.length, letters.length + 1);

        if ([...letters, nextLetter].join("") === title) {
          setCanReverse(true);
        }

        if (canReverse) {
          const previousLetter = title.slice(0, letters.length - 1);

          setLetter([...previousLetter]);

          if (previousLetter.length === 0) {
            setCanReverse(false);

            const nextId = currentTitleId + 1;

            setLetter([nextLetter]);

            if (nextId <= typingData.length) {
              setCurrentTitleId(nextId);
            } else {
              setCurrentTitleId(0);
            }
          }
        } else if (nextLetter) {
          setLetter([...letters, nextLetter]);
        }
      } else {
        setCurrentTitleId(0);
      }
    }, 180);

    return () => clearTimeout(timeout);
  }, [canReverse, currentTitleId, letters, typingData]);

  return letters.join("")
        .replaceAll(/(:)/gi, "<span>")
        .replaceAll(/(;)/gi, "</span>");
};
