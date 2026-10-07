import { FC } from "react";

import tw from "twin.macro";

import { Blueprint } from "@/components/Blueprint/Blueprint";
import { BlueprintTabs } from "@/components/Blueprint/BlueprintTabs";
import { Blueprint as BlueprintContent, BlueprintLabels } from "@/types/blueprints";

export interface BlueprintListProps {
  blueprints: BlueprintContent[];
  labels: BlueprintLabels;
}

const List = tw.div`flex flex-col gap-[22px] lg:gap-[30px]`;

// Several blueprints become a tabbed showcase; a single one is drawn as it is.
export const BlueprintList: FC<BlueprintListProps> = ({ blueprints, labels }: BlueprintListProps) => (
  blueprints.length > 1 ? <BlueprintTabs blueprints={blueprints} labels={labels} /> : (
    <List>
      {blueprints.map((blueprint) => <Blueprint key={blueprint.id} {...blueprint} labels={labels} />)}
    </List>
  )
);
