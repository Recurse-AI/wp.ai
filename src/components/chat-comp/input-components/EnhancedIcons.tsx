"use client";

export const KnowledgeBaseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="3" width="16" height="18" rx="2" fill="url(#kb_gradient)" fillOpacity="0.25" />
    <path d="M4 7C4 5.34315 5.34315 4 7 4H17C18.6569 4 20 5.34315 20 7V21H7C5.34315 21 4 19.6569 4 18V7Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20 21V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 7H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 11H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 15H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="16" cy="7" r="2" fill="url(#kb_accent)" />
    <path d="M11 7H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M11 11H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M11 15H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <defs>
      <linearGradient id="kb_gradient" x1="4" y1="3" x2="20" y2="21" gradientUnits="userSpaceOnUse">
        <stop stopColor="#3B82F6" />
        <stop offset="1" stopColor="#1D4ED8" />
      </linearGradient>
      <linearGradient id="kb_accent" x1="14" y1="5" x2="18" y2="9" gradientUnits="userSpaceOnUse">
        <stop stopColor="#60A5FA" />
        <stop offset="1" stopColor="#3B82F6" />
      </linearGradient>
    </defs>
  </svg>
);

export const AgentIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9" fill="url(#agent_gradient)" fillOpacity="0.2" />
    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" />
    <path d="M12 15L9 13.5V10.5L12 9L15 10.5V13.5L12 15Z" fill="url(#agent_accent)" />
    <path d="M12 15L9 13.5V10.5L12 9L15 10.5V13.5L12 15Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M12 9V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M15 10.5L17 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M15 13.5L17 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M12 15V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M9 13.5L7 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M9 10.5L7 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <defs>
      <linearGradient id="agent_gradient" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
        <stop stopColor="#A855F7" />
        <stop offset="1" stopColor="#7E22CE" />
      </linearGradient>
      <linearGradient id="agent_accent" x1="9" y1="9" x2="15" y2="15" gradientUnits="userSpaceOnUse">
        <stop stopColor="#C084FC" />
        <stop offset="1" stopColor="#A855F7" />
      </linearGradient>
    </defs>
  </svg>
);

export const DefaultIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="18" height="18" rx="5" fill="currentColor" fillOpacity="0.1" />
    <path d="M3 11C3 7.22876 3 5.34315 4.17157 4.17157C5.34315 3 7.22876 3 11 3H13C16.7712 3 18.6569 3 19.8284 4.17157C21 5.34315 21 7.22876 21 11V13C21 16.7712 21 18.6569 19.8284 19.8284C18.6569 21 16.7712 21 13 21H11C7.22876 21 5.34315 21 4.17157 19.8284C3 18.6569 3 16.7712 3 13V11Z" stroke="currentColor" strokeWidth="1.5" />
    <path d="M7 8.5C7 7.67157 7.67157 7 8.5 7H15.5C16.3284 7 17 7.67157 17 8.5C17 9.32843 16.3284 10 15.5 10H8.5C7.67157 10 7 9.32843 7 8.5Z" fill="currentColor" fillOpacity="0.15" />
    <path d="M7 15.5C7 14.6716 7.67157 14 8.5 14H15.5C16.3284 14 17 14.6716 17 15.5C17 16.3284 16.3284 17 15.5 17H8.5C7.67157 17 7 16.3284 7 15.5Z" fill="currentColor" fillOpacity="0.15" />
    <path d="M8 8.5H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M8 15.5H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" fillOpacity="0.1" />
    <circle cx="8.5" cy="15.5" r="1.5" fill="currentColor" fillOpacity="0.1" />
  </svg>
);

export const SendIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21.5 11.0962V11.9336C21.5 12.5163 20.8733 12.9336 20.3733 12.6586L15.6164 10.0445C15.4091 9.9336 15.2645 9.7391 15.2236 9.5136L14.5608 5.6813C14.4462 5.03813 15.0394 4.5 15.6164 4.76834L20.8733 7.76834C21.2522 7.9445 21.5 8.34447 21.5 8.78834V11.0962Z" fill="white" />
    <path d="M21.5 11.0962V11.9336C21.5 12.5163 20.8733 12.9336 20.3733 12.6586L15.6164 10.0445C15.4091 9.9336 15.2645 9.7391 15.2236 9.5136L14.5608 5.6813C14.4462 5.03813 15.0394 4.5 15.6164 4.76834L20.8733 7.76834C21.2522 7.9445 21.5 8.34447 21.5 8.78834V11.0962Z" fill="url(#send_gradient)" />
    <path d="M21.6584 3.57354C21.218 3.1331 20.5465 3.00861 20.0039 3.23354L4.00177 9.79785C3.2463 10.1202 3.04603 11.1317 3.65072 11.7363C3.76502 11.8506 3.90201 11.9414 4.05358 12.002L9.94177 14.2978L12.2376 20.186C12.2983 20.3376 12.389 20.4745 12.5034 20.5889C13.108 21.1935 14.1195 20.9933 14.4419 20.2378L20.9964 4.2356C21.2213 3.69298 21.097 3.0216 20.6584 2.58276C20.9964 2.92059 21.3199 3.25 21.6584 3.57354Z" fill="url(#send_bg_gradient)" />
    <path d="M21.6584 3.57354C21.218 3.1331 20.5465 3.00861 20.0039 3.23354L4.00177 9.79785C3.2463 10.1202 3.04603 11.1317 3.65072 11.7363C3.76502 11.8506 3.90201 11.9414 4.05358 12.002L9.94177 14.2978L12.2376 20.186C12.2983 20.3376 12.389 20.4745 12.5034 20.5889C13.108 21.1935 14.1195 20.9933 14.4419 20.2378L20.9964 4.2356C21.2213 3.69298 21.097 3.0216 20.6584 2.58276C20.9964 2.92059 21.3199 3.25 21.6584 3.57354Z" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9.94173 14.2978L12.8397 11.3999" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    <defs>
      <linearGradient id="send_gradient" x1="14.5" y1="4.5" x2="21.5" y2="12.5" gradientUnits="userSpaceOnUse">
        <stop stopColor="#60A5FA" />
        <stop offset="1" stopColor="#3B82F6" />
      </linearGradient>
      <linearGradient id="send_bg_gradient" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
        <stop stopColor="#60A5FA" />
        <stop offset="1" stopColor="#3B82F6" />
      </linearGradient>
    </defs>
  </svg>
);

export const WordPressIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" fill="url(#wp_gradient)" />
    <path d="M12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2ZM3.5 12C3.5 10.4 3.9 8.9 4.7 7.6L8.8 19.4C5.7 18 3.5 15.2 3.5 12ZM12 20.5C10.9 20.5 9.8 20.3 8.8 19.9L11.3 12.3L13.9 19.6C13.9 19.6 13.9 19.7 14 19.7C13.4 20.2 12.7 20.5 12 20.5ZM13.5 7.5C14.1 7.5 14.5 7.4 14.5 7.4C14.9 7.3 14.8 6.7 14.5 6.7C14.5 6.7 13 6.9 12 6.9C11.1 6.9 9.6 6.7 9.6 6.7C9.2 6.7 9.2 7.3 9.5 7.4C9.5 7.4 9.9 7.5 10.5 7.5L11.7 10.6L9.7 16.5L6.3 7.5C6.9 7.5 7.3 7.4 7.3 7.4C7.7 7.3 7.6 6.7 7.3 6.7C7.3 6.7 5.8 6.9 4.8 6.9C4.6 6.9 4.4 6.9 4.1 6.9C5.7 4.4 8.7 3 12 3C14.6 3 17 4 18.7 5.8C18.6 5.8 18.5 5.7 18.3 5.7C17.4 5.7 16.8 6.5 16.8 7.3C16.8 8 17.2 8.5 17.6 9.2C17.9 9.7 18.3 10.3 18.3 11.3C18.3 12 18 12.8 17.6 14L16.7 17.1L13.5 7.5ZM16.1 19.1L18.8 11.3C19.3 10 19.4 9 19.4 8.2C19.4 7.9 19.4 7.6 19.3 7.3C20.1 8.7 20.5 10.3 20.5 12C20.5 15 18.7 17.6 16.1 19.1Z" fill="white" />
    <defs>
      <linearGradient id="wp_gradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#2271B1" />
        <stop offset="1" stopColor="#0A4B78" />
      </linearGradient>
    </defs>
  </svg>
);

export const BrainIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2Z" fill="url(#brain_gradient)" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M12 6.5C11.1716 6.5 10.5 7.17157 10.5 8C10.5 8.82843 11.1716 9.5 12 9.5C12.8284 9.5 13.5 8.82843 13.5 8C13.5 7.17157 12.8284 6.5 12 6.5Z" fill="url(#brain_accent)" stroke="currentColor" strokeWidth="1" />
    <path d="M9 11C8.44772 11 8 11.4477 8 12C8 12.5523 8.44772 13 9 13C9.55228 13 10 12.5523 10 12C10 11.4477 9.55228 11 9 11Z" fill="url(#brain_accent)" stroke="currentColor" strokeWidth="1" />
    <path d="M12 14.5C11.1716 14.5 10.5 15.1716 10.5 16C10.5 16.8284 11.1716 17.5 12 17.5C12.8284 17.5 13.5 16.8284 13.5 16C13.5 15.1716 12.8284 14.5 12 14.5Z" fill="url(#brain_accent)" stroke="currentColor" strokeWidth="1" />
    <path d="M15 11C14.4477 11 14 11.4477 14 12C14 12.5523 14.4477 13 15 13C15.5523 13 16 12.5523 16 12C16 11.4477 15.5523 11 15 11Z" fill="url(#brain_accent)" stroke="currentColor" strokeWidth="1" />
    <path d="M10 9L9 11" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    <path d="M10 13L10.5 14.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    <path d="M14 13L13.5 14.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    <path d="M14 9L15 11" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    <defs>
      <linearGradient id="brain_gradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#3B82F6" />
        <stop offset="1" stopColor="#1D4ED8" />
      </linearGradient>
      <linearGradient id="brain_accent" x1="8" y1="6.5" x2="16" y2="17.5" gradientUnits="userSpaceOnUse">
        <stop stopColor="#60A5FA" />
        <stop offset="1" stopColor="#3B82F6" />
      </linearGradient>
    </defs>
  </svg>
);

export const LoadingIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-spin">
    <path d="M12 2.75C12.4142 2.75 12.75 3.08579 12.75 3.5V7.5C12.75 7.91421 12.4142 8.25 12 8.25C11.5858 8.25 11.25 7.91421 11.25 7.5V3.5C11.25 3.08579 11.5858 2.75 12 2.75Z" fill="url(#loading_gradient)" />
    <path d="M12 15.75C12.4142 15.75 12.75 16.0858 12.75 16.5V20.5C12.75 20.9142 12.4142 21.25 12 21.25C11.5858 21.25 11.25 20.9142 11.25 20.5V16.5C11.25 16.0858 11.5858 15.75 12 15.75Z" fill="url(#loading_gradient)" fillOpacity="0.2" />
    <path d="M20.5 11.25C20.9142 11.25 21.25 11.5858 21.25 12C21.25 12.4142 20.9142 12.75 20.5 12.75H16.5C16.0858 12.75 15.75 12.4142 15.75 12C15.75 11.5858 16.0858 11.25 16.5 11.25H20.5Z" fill="url(#loading_gradient)" fillOpacity="0.4" />
    <path d="M8.25 12C8.25 12.4142 7.91421 12.75 7.5 12.75H3.5C3.08579 12.75 2.75 12.4142 2.75 12C2.75 11.5858 3.08579 11.25 3.5 11.25H7.5C7.91421 11.25 8.25 11.5858 8.25 12Z" fill="url(#loading_gradient)" fillOpacity="0.6" />
    <path d="M17.7676 17.7676C17.4677 18.0676 16.9823 18.0676 16.6824 17.7676L13.9033 14.9886C13.6034 14.6886 13.6034 14.2033 13.9033 13.9033C14.2033 13.6034 14.6886 13.6034 14.9886 13.9033L17.7676 16.6824C18.0676 16.9823 18.0676 17.4677 17.7676 17.7676Z" fill="url(#loading_gradient)" fillOpacity="0.3" />
    <path d="M10.0967 10.0967C10.3966 9.79678 10.3966 9.31146 10.0967 9.01149L7.31757 6.23243C7.0176 5.93246 6.53228 5.93246 6.23231 6.23243C5.93234 6.5324 5.93234 7.01772 6.23231 7.31769L9.01137 10.0967C9.31134 10.3967 9.79666 10.3967 10.0967 10.0967Z" fill="url(#loading_gradient)" fillOpacity="0.7" />
    <path d="M6.23243 17.7676C5.93246 17.4677 5.93246 16.9823 6.23243 16.6824L9.01149 13.9033C9.31146 13.6034 9.79678 13.6034 10.0967 13.9033C10.3967 14.2033 10.3967 14.6886 10.0967 14.9886L7.31769 17.7676C7.01772 18.0676 6.5324 18.0676 6.23243 17.7676Z" fill="url(#loading_gradient)" fillOpacity="0.5" />
    <path d="M13.9033 10.0967C13.6034 9.79678 13.6034 9.31146 13.9033 9.01149L16.6824 6.23243C16.9823 5.93246 17.4677 5.93246 17.7676 6.23243C18.0676 6.5324 18.0676 7.01772 17.7676 7.31769L14.9886 10.0967C14.6886 10.3967 14.2033 10.3967 13.9033 10.0967Z" fill="url(#loading_gradient)" fillOpacity="0.9" />
    <defs>
      <linearGradient id="loading_gradient" x1="2.75" y1="2.75" x2="21.25" y2="21.25" gradientUnits="userSpaceOnUse">
        <stop stopColor="#60A5FA" />
        <stop offset="1" stopColor="#3B82F6" />
      </linearGradient>
    </defs>
  </svg>
); 