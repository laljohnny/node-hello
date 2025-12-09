import { Icon, IconProps } from "@chakra-ui/react";

const SubmitTicketHover = (props: IconProps & any) => (
  <Icon viewBox="0 0 48 48" boxSize={{ base: "6", md: "8" }} {...props}>
    <g clipPath="url(#submit_ticket)">
      <path
        d="M37.048 16.16v18.892a4.64 4.64 0 0 1-4.635 4.635h-8.54l-5.35 3.73-6.557 4.576v-8.306H4.635A4.64 4.64 0 0 1 0 35.052V16.159a4.64 4.64 0 0 1 4.635-4.635h27.778a4.64 4.64 0 0 1 4.635 4.635Z"
        fill="#DA9906"
      />
      <path
        d="M37.048 16.16v18.892a4.64 4.64 0 0 1-4.635 4.635h-8.54l-5.35 3.73V11.525h13.89a4.64 4.64 0 0 1 4.635 4.635Z"
        fill="#DA9906"
      />
      <path
        d="M46.947 6.142 28.435 24.655l-5.3.218.218-5.3L41.866 1.06a3.594 3.594 0 1 1 5.081 5.081Z"
        fill="#C28100"
      />
      <path
        d="M6.452 18.733h12.072v2.813H6.452v-2.813ZM6.452 24.192h12.072v2.813H6.452v-2.813ZM6.452 29.651h24.08v2.813H6.451V29.65Z"
        fill="#FFC84E"
      />
      <path
        d="M46.947 6.142 28.435 24.654l-5.3.218L46.948 1.06A3.58 3.58 0 0 1 48 3.6c0 .92-.351 1.84-1.053 2.542Z"
        fill="#C28100"
      />
      <path
        d="m29.666 23.424-1.23 1.23-5.3.219.217-5.3 1.231-1.231 5.082 5.082Z"
        fill="#FFC84E"
      />
      <path
        d="m29.666 23.424-1.23 1.23-5.3.219 3.99-3.99 2.54 2.54ZM18.524 29.652H30.53v2.813H18.524v-2.813Z"
        fill="#FFC84E"
      />
    </g>
    <defs>
      <clipPath id="submit_ticket">
        <path fill="#fff" d="M0 0h48v48H0z" />
      </clipPath>
    </defs>
  </Icon>
);

export default SubmitTicketHover;
