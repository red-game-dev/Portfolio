import { FontAwesomeIconProps } from "@fortawesome/react-fontawesome";

export interface Service {
  icon: FontAwesomeIconProps["icon"];
  title: string;
  description: string;
  points?: string[];
  // Subject line for the prefilled email link.
  emailSubject: string;
}

export interface ServiceGroup {
  label: string;
  services: Service[];
}

export interface ServiceActions {
  email: string;
  linkedIn: string;
}
