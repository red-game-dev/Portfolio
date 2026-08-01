import { FontAwesomeIconProps } from "@fortawesome/react-fontawesome";

export interface Service {
  icon: FontAwesomeIconProps["icon"];
  title: string;
  description: string;
  link?: string;
  linkLabel?: string;
  linkIcon?: FontAwesomeIconProps["icon"];
}
