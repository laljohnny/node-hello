import { Icon, IconProps } from "@chakra-ui/react";
import { useState } from "react";

const NewFolder = (props: IconProps & any) => {
  const [id1] = useState(`mask0_new_folder${Math.random()}`);
  const [id2] = useState(`paint0_linear_new_folder${Math.random()}`);
  const [id3] = useState(`paint1_linear_new_folder${Math.random()}`);

  return (
    <Icon width="24px" height="19px" viewBox="0 0 24 19" {...props}>
      <path
        d="M0 18.2873C0 18.6257 0.271594 18.9001 0.607527 18.9001H23.3924C23.7279 18.9001 23.9999 18.6252 23.9999 18.2872V3.06507C23.9999 2.38789 23.4557 1.83893 22.7851 1.83893H9.34872C9.01317 1.83893 8.56827 1.62708 8.35469 1.36536L7.56242 0.394496C7.38462 0.176622 7.01385 0 6.73423 0H1.21496C0.543954 0 0 0.549055 0 1.22552V18.2873Z"
        fill="#CACACA"
      />
      <mask
        id={id1}
        mask-type="alpha"
        maskUnits="userSpaceOnUse"
        x="0"
        y="3"
        width="24"
        height="16"
      >
        <path
          d="M0 18.3831C0 18.7238 0.271594 19 0.607527 19H23.3924C23.7279 19 23.9999 18.7242 23.9999 18.3831V4.24733C23.9999 3.566 23.4557 3.01367 22.7851 3.01367H1.21487C0.543916 3.01367 0 3.56628 0 4.24733V18.3831Z"
          fill="white"
        />
      </mask>
      <g mask={`url(#${id1})`}>
        <path
          d="M0 18.3826C0 18.7236 0.271595 19 0.607528 19H23.3925C23.728 19 24 18.724 24 18.3826V4.23472C24 3.5528 23.4558 3 22.7851 3H1.21487C0.543917 3 0 3.55308 0 4.23472V18.3826Z"
          fill="#7A7A7A"
        />
        <path d="M24 17H0V18H24V17Z" fill={`url(#${id2})`} />
        <path opacity="0.7" d="M24 18H0V19H24V18Z" fill={`url(#${id3})`} />
      </g>
      <rect x="11.3999" y="7" width="1.2" height="5.9375" fill="white" />
      <rect
        x="9"
        y="10.5625"
        width="1.1875"
        height="6"
        transform="rotate(-90 9 10.5625)"
        fill="white"
      />
      <defs>
        <linearGradient
          id={id2}
          x1="12"
          y1="17"
          x2="12"
          y2="17.9898"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" stopOpacity="0.303216" />
          <stop offset="0.128009" stopColor="#C0C0C0" stopOpacity="0.28" />
          <stop offset="0.588542" stopColor="#6A6A6A" stopOpacity="0.14" />
          <stop offset="1" stopColor="#0B0B0B" stopOpacity="0.135303" />
        </linearGradient>
        <linearGradient
          id={id3}
          x1="12"
          y1="18"
          x2="12"
          y2="19"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" stopOpacity="0.303216" />
          <stop offset="0.265625" stopColor="#E2E2E2" stopOpacity="0.101676" />
          <stop offset="1" stopColor="#474747" stopOpacity="0.28" />
        </linearGradient>
      </defs>
    </Icon>
  );
};

export default NewFolder;
