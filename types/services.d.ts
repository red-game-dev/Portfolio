import { FontAwesomeIconProps } from "@fortawesome/react-fontawesome";

export interface Service {
  icon: FontAwesomeIconProps["icon"];
  title: string;
  description: string;
  points?: string[];
  // Subject line for the prefilled email link.
  emailSubject: string;
  // A link to where the page shows this work.
  see?: { label: string; href: string };
}

export interface ServiceGroup {
  label: string;
  services: Service[];
}

export interface ServiceActions {
  email: string;
  linkedIn: string;
}
