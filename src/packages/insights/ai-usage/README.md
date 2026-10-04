# insights/ai-usage

Domain model and service for presenting how someone uses AI: a headline, a task breakdown that sums to a whole, a staged agent workflow, and a timeline.

## Flow

```
ContentSource.read()  ->  isAiUsageContent (guard)  ->  AiUsageContentValidator  ->  AiUsageViewMapper  ->  AiUsageView
     raw data              shape, or a typed error       rules, every error          ranked, labelled
```

`AiUsageService` extends `ContentService` from `core/content`, which owns that order. The service only chooses the guard, validator and mapper.

## Not tied to a host

- Content arrives through the `ContentSource` port as `unknown`, so it can come from a file, a CMS or an API. The guard proves its shape before anything trusts it.
- Stage icons are a type parameter (`AiUsageService<TIcon>`), so the package never imports an icon library.
- The share total lives in `config/` and can be changed per validator.

## Rules enforced

- Every task share is a whole, positive number, task names are unique, and the shares add up to 100.
- There is at least one agent stage and at least one headline line.

Breaking a rule throws `AiUsageValidationError` listing every problem, which fails a static build instead of shipping a wrong chart.

## Usage

```ts
import { InMemoryContentSource } from "@/packages/core/content";
import { AiUsageService } from "@/packages/insights/ai-usage";

const view = new AiUsageService<IconDefinition>(new InMemoryContentSource(content)).getView();
```
