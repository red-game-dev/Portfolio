import { FC } from "react";

import tw, { css, styled } from "twin.macro";

import { usePreferencesStateHook } from "@/components/Preferences/hooks/usePreferencesStateHook";
import { PreferenceName, SITE_PREFERENCES } from "@/config/preferences";
import { PreferencesContent } from "@/types/preferences";

interface SettingsPanelProps {
  copy: PreferencesContent;
}

const Group = tw.fieldset`m-0 p-0 border-0 flex flex-col gap-[6px]`;

const Name = tw.legend`p-0 mb-[4px] text-sm font-semibold text-white`;

const Description = tw.p`m-0 text-xs text-[#9aa3bb] leading-relaxed max-w-[60ch]`;

const Options = tw.div`flex flex-row flex-wrap gap-[8px]`;

// An option as a pill: the radio inside it, its label beside it, filled once chosen.
const Option = styled.label(({ isChosen }: { isChosen: boolean }) => [
  tw`flex flex-row items-center gap-[6px] px-[10px] py-[6px] text-xs cursor-pointer border-[1px] border-solid border-[rgba(196,210,255,0.3)] text-[#c4d2ff]`,
  isChosen && tw`bg-[rgba(196,210,255,0.16)] border-[#c4d2ff] text-white`,
  css`
    &:focus-within {
      outline: 2px solid #c4d2ff;
      outline-offset: 2px;
    }

    input {
      accent-color: #c4d2ff;
      margin: 0;
    }
  `,
]);

const Note = tw.p`m-0 text-xs text-[#9aa3bb]`;

const List = tw.div`flex flex-col gap-[18px]`;

// The reader's settings as a form: each preference a group of options (or a switch), changed as soon as one is
// picked and kept in this browser. The same store the terminal's `set` changes, so either shows the other's change.
export const SettingsPanel: FC<SettingsPanelProps> = ({ copy }: SettingsPanelProps) => {
  const { values, set } = usePreferencesStateHook();
  const names = Object.keys(SITE_PREFERENCES).filter((key): key is PreferenceName => key in copy.items);

  return (
    <List>
      {names.map((name) => {
        const setting = SITE_PREFERENCES[name];
        const item = copy.items[name];
        const describedBy = `setting-${name}-about`;

        return (
          <Group key={name} aria-describedby={describedBy}>
            <Name>{item.name}</Name>
            <Description id={describedBy}>{item.description}</Description>
            <Options>
              {setting.options.map((option) => (
                <Option key={option} isChosen={values[name] === option}>
                  <input type="radio" name={`setting-${name}`} value={option} checked={values[name] === option} onChange={() => set(name, option)} />
                  {item.options[option] ?? option}
                </Option>
              ))}
            </Options>
          </Group>
        );
      })}
      <Note>{copy.note}</Note>
    </List>
  );
};
