import { FC, Fragment, ReactNode, useId } from "react";

import tw, { styled } from "twin.macro";

import type { CurrencyCode, Purse } from "@/packages/games/voyage";
import { formatNumber } from "@/packages/text/format";
import { VoyageEconomyCopy } from "@/types/game";

const CURRENCIES: readonly CurrencyCode[] = ["RED", "VOID"];

// The R struck in a Red Coin, and the shard's facets, on a 16 unit grid.
const R_PATH = "M6.2 11.4V4.6h2.3a1.9 1.9 0 0 1 0 3.8H6.2M8.3 8.4l2 3";
const FACETS: ReadonlyArray<[string, string]> = [
  ["M8 1.4 3.4 6 8 7.3Z", "#ead2ff"],
  ["M8 1.4 12.6 6 8 7.3Z", "#c58bff"],
  ["M3.4 6 8 14.6V7.3Z", "#a768ee"],
  ["M12.6 6 8 14.6V7.3Z", "#7a3fc4"],
];

const Icon = styled.svg`
  ${tw`inline-block flex-shrink-0 w-[1.15em] h-[1.15em]`}

  vertical-align: -0.2em;
`;

// A currency's mark: a Red Coin as the gold coins flown through in space look (a gold disc, a raised rim and an R
// struck in it), a Void Shard as a violet crystal. Named for whoever cannot see it, and on hover, unless the words
// beside it already say what it is.
export const CurrencyIcon: FC<{ code: CurrencyCode; label: string; isDecorative?: boolean }> = ({ code, label, isDecorative = false }) => {
  // An id fit to name the coin's gradient, whatever characters React makes ids of.
  const id = `coin${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const named = isDecorative ? { "aria-hidden": true } : { "role": "img", "aria-label": label };

  return (
    <Icon viewBox="0 0 16 16" focusable="false" {...named}>
      {!isDecorative && <title>{label}</title>}
      {code === "RED" ? (
        <>
          <defs>
            <radialGradient id={`${id}-face`} cx="0.38" cy="0.36" r="0.7">
              <stop offset="0" stopColor="#fff3c4" />
              <stop offset="0.55" stopColor="#ffd76a" />
              <stop offset="1" stopColor="#b07a10" />
            </radialGradient>
          </defs>
          <circle cx="8" cy="8" r="7.2" fill={`url(#${id}-face)`} stroke="#8a5a00" strokeWidth="0.8" />
          <circle cx="8" cy="8" r="5.4" fill="none" stroke="#8a5a00" strokeWidth="0.7" opacity="0.7" />
          <path d={R_PATH} fill="none" stroke="#8a5a00" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : (
        <>
          {FACETS.map(([path, fill]) => <path key={path} d={path} fill={fill} />)}
          <path d="M8 1.4 12.6 6 8 14.6 3.4 6Z" fill="none" stroke="#4b2187" strokeWidth="0.7" strokeLinejoin="round" />
        </>
      )}
    </Icon>
  );
};

const Sum = tw.span`inline-flex items-center gap-[0.25em] whitespace-nowrap tabular-nums`;

// An amount with its currency's mark: "742" and a coin, "+3" and a shard.
export const Money: FC<{ copy: VoyageEconomyCopy; amount: number; code?: CurrencyCode; isSigned?: boolean }> = ({ copy, amount, code = "RED", isSigned = false }) => (
  <Sum>
    {`${isSigned && amount > 0 ? "+" : ""}${formatNumber(amount)}`}
    <CurrencyIcon code={code} label={copy.currencies[code]} />
  </Sum>
);

// Money in both currencies, leaving out one that is nothing (none at all reads as no Red Coin).
export const PurseAmounts: FC<{ copy: VoyageEconomyCopy; purse: Purse; isSigned?: boolean }> = ({ copy, purse, isSigned = false }) => {
  const codes = CURRENCIES.filter((code) => purse[code] !== 0);

  return (
    <Sum>
      {(codes.length > 0 ? codes : ["RED" as const]).map((code, index) => (
        <Fragment key={code}>
          {index > 0 && ", "}
          <Money copy={copy} amount={purse[code]} code={code} isSigned={isSigned} />
        </Fragment>
      ))}
    </Sum>
  );
};

// A template ("Sell a Void Shard for {price}") filled with parts that may be more than text, such as an amount with
// its mark. A placeholder with nothing for it is left as it is.
export const fillNodes = (template: string, values: Record<string, ReactNode>): ReactNode[] =>
  template.split(/(\{\w+\})/).filter((part) => part !== "")
    .map((part, index) => {
      const key = /^\{(\w+)\}$/.exec(part)?.[1];

      return <Fragment key={index}>{key !== undefined && key in values ? values[key] : part}</Fragment>;
    });
