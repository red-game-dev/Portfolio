import { act, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";

import { LensProvider } from "@/components/Lens/context/LensContext";
import { PreferencesProvider } from "@/components/Preferences/context/PreferencesContext";
import { Terminal } from "@/components/Terminal";
import { portfolioData } from "@/data/resume";
import { useOnline } from "@/hooks/useOnline";
import { createPortfolioTerminal } from "@/services/terminal/portfolioTerminal";

jest.mock("@/services/voyage/board/client", () => ({ fetchBoard: jest.fn(), postRun: jest.fn() }));
jest.mock("@/services/ask/client", () => ({ askRed: jest.fn() }));

// Jest here does not lift mocks above the imports, so the board, which reads its client as it loads, loads after its mock.
const { DailyBoard } = jest.requireActual<typeof import("@/components/Finale/Voyage/Board/DailyBoard")>("@/components/Finale/Voyage/Board/DailyBoard");
const board = jest.requireMock<{ fetchBoard: jest.Mock; postRun: jest.Mock }>("@/services/voyage/board/client");
const ask = jest.requireMock<{ askRed: jest.Mock }>("@/services/ask/client");
const voyage = portfolioData.finale.voyage;

// The browser's word on the connection, changed as a browser changes it.
const connection = () => {
  const onLine = jest.spyOn(window.navigator, "onLine", "get").mockReturnValue(true);

  return {
    set: (isOnline: boolean) => act(() => {
      onLine.mockReturnValue(isOnline);
      window.dispatchEvent(new Event(isOnline ? "online" : "offline"));
    }),
    restore: () => onLine.mockRestore(),
  };
};

describe("what needs a connection, offline", () => {
  let browser: ReturnType<typeof connection>;

  beforeAll(() => {
    if (typeof Element.prototype.scrollIntoView !== "function") {
      Element.prototype.scrollIntoView = () => undefined;
    }

    if (typeof HTMLElement.prototype.scrollTo !== "function") {
      HTMLElement.prototype.scrollTo = () => undefined;
    }
  });

  beforeEach(() => {
    browser = connection();
    board.fetchBoard.mockReset();
    ask.askRed.mockReset();
  });

  afterEach(() => browser.restore());

  it("follows the browser's word on the connection as it comes and goes", () => {
    const { result } = renderHook(() => useOnline());

    expect(result.current).toBe(true);
    browser.set(false);
    expect(result.current).toBe(false);
    browser.set(true);
    expect(result.current).toBe(true);
  });

  it("the daily board says it needs a connection, offers no run to it, and reads the board once back online", async () => {
    board.fetchBoard.mockResolvedValue({ entries: [{ initials: "RED", score: 1200 }] });
    browser.set(false);
    render(<DailyBoard content={voyage} day="2026-10-18" score={900} />);

    expect(screen.getByText(voyage.board.offline)).toBeInTheDocument();
    expect(screen.queryByText(voyage.board.resting)).toBeNull();
    expect(screen.queryByRole("button", { name: voyage.board.submit })).toBeNull();
    expect(board.fetchBoard).not.toHaveBeenCalled();

    browser.set(true);
    await waitFor(() => expect(screen.getByText("1. RED")).toBeInTheDocument());
    expect(screen.queryByText(voyage.board.offline)).toBeNull();
    expect(screen.getByRole("button", { name: voyage.board.submit })).toBeInTheDocument();

    browser.set(false);
    expect(screen.getByText(voyage.board.offline)).toBeInTheDocument();
    expect(screen.getByText("1. RED")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: voyage.board.submit })).toBeNull();

    browser.set(true);
    expect(board.fetchBoard).toHaveBeenCalledTimes(1);
  });

  it("Ask Red says it needs a connection rather than asking, and asks once back online", async () => {
    ask.askRed.mockImplementation(async function* answer() {
      yield { type: "text", text: "Red builds platforms." };
      yield { type: "done" };
    });
    render(
      <PreferencesProvider>
        <LensProvider>
          <Terminal intro={portfolioData.sections.terminal} content={portfolioData.terminal} createSession={createPortfolioTerminal} />
        </LensProvider>
      </PreferencesProvider>,
    );

    const prompt = screen.getByLabelText(portfolioData.terminal.inputLabel);
    const askAbout = async (question: string) => {
      fireEvent.change(prompt, { target: { value: `ask ${question}` } });
      await act(async () => {
        fireEvent.submit(prompt);
      });
    };

    browser.set(false);
    await askAbout("what does Red build?");
    await waitFor(() => expect(screen.getByText(portfolioData.terminal.ask.offline)).toBeInTheDocument());
    expect(ask.askRed).not.toHaveBeenCalled();

    browser.set(true);
    await askAbout("what does Red build?");
    await waitFor(() => expect(ask.askRed).toHaveBeenCalledTimes(1));
  });
});
