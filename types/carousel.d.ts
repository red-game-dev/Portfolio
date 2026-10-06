export interface CarouselLabels {
  previous: string;
  next: string;
  // "{from}", "{to}" and "{count}" are replaced, for example "3 to 4 of 23".
  position: string;
  // When a page holds one card: "{from}" and "{count}", for example "3 of 23".
  single: string;
}
