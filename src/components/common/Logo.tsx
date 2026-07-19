"use client";

import Image from "next/image";

export default function Logo() {
  return (
    <>
      <div className="block dark:hidden">
        <Image
          src="/images/logo.png"
          alt="logo"
          width={100}
          height={100}
          className={"w-15 h-auto"}
          priority
        />
      </div>

      <div className="hidden dark:block">
        <Image
          src="/images/logo.webp"
          alt="logo"
          width={100}
          height={100}
          className={"w-15 h-auto"}
          priority
        />
      </div>
    </>
  );
}
