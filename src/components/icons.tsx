import type { SVGProps } from "react";

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12.22 2h-4.44L4 10.44v7.12l4.44 3.44h7.12L20 17.56V10.44L12.22 2z"></path>
      <path d="M8.44 2l8 8.08"></path>
      <path d="M15.56 22L8 14.02"></path>
      <path d="M8.44 12.22H4v3.34"></path>
      <path d="M15.56 8.44H20v3.34"></path>
    </svg>
  );
}
