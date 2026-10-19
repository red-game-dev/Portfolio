import { SECTION_BLUEPRINTS } from "@/data/blueprints/all";

describe("the DevOps universe's drawings", () => {
  test("they show the commerce platform's Kubernetes rollout in their own look, the same drawing and not a copy", () => {
    const shown = SECTION_BLUEPRINTS.devops.find((blueprint) => blueprint.id === "devops-kubernetes");
    const original = SECTION_BLUEPRINTS.delivery.find((blueprint) => blueprint.id === "commerce-delivery");

    expect(shown?.zone).toBe("devops");
    expect(original).toBeDefined();
    expect(shown?.architecture).toBe(original?.architecture);
  });

  test("every one of them is drawn in the DevOps universe", () => {
    expect(SECTION_BLUEPRINTS.devops.map((blueprint) => blueprint.zone)).toEqual(SECTION_BLUEPRINTS.devops.map(() => "devops"));
  });
});
