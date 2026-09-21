import React, { useEffect, useId, useState } from "react";

function SidebarLinkGroup({
  children,
  activecondition,
}) {
  const groupId = useId();

  const [open, setOpen] = useState(activecondition);

  // Keep the active route group open
  useEffect(() => {
    if (activecondition) {
      setOpen(true);
    }
  }, [activecondition]);

  // Listen when another sidebar group is opened
  useEffect(() => {
    const handleOtherGroupOpen = (event) => {
      if (event.detail !== groupId) {
        setOpen(false);
      }
    };

    window.addEventListener(
      "sidebar-group-open",
      handleOtherGroupOpen
    );

    return () => {
      window.removeEventListener(
        "sidebar-group-open",
        handleOtherGroupOpen
      );
    };
  }, [groupId]);

  const handleClick = () => {
    setOpen((prevOpen) => {
      const newOpen = !prevOpen;

      // If this group is being opened,
      // close every other group
      if (newOpen) {
        window.dispatchEvent(
          new CustomEvent("sidebar-group-open", {
            detail: groupId,
          })
        );
      }

      return newOpen;
    });
  };

  return (
    <li
      className={`pl-4 pr-3 py-2 rounded-lg mb-0.5 last:mb-0 bg-linear-to-r ${
        activecondition
          ? "from-violet-500/[0.12] dark:from-violet-500/[0.24] to-violet-500/[0.04]"
          : ""
      }`}
    >
      {children(handleClick, open)}
    </li>
  );
}

export default SidebarLinkGroup;