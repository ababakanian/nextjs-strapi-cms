export const dynamic = "force-dynamic"

import { ArrowRightIcon } from "@heroicons/react/24/outline"
import Link from "next/link"
import { lusitana } from "@/app/ui/fonts"
import clsx from "clsx"
import Image from "next/image"
import { ContentNode, HomepageData, HomepageResponse } from "./pageTypes"
import React from "react"

const API_ROUTE = `http://${process.env.STRAPI_HOST}:${process.env.STRAPI_PORT}/api/homepage?populate=*`

const Homepage = ({ data }: { data: HomepageResponse }) => {
  const { Hero, Body, Cover } = data.data.attributes

  const renderContent = (item: ContentNode) => {
    switch (item.type) {
      case "heading":
        const headingClasses =
          item.level === 1
            ? "text-4xl font-bold text-gray-800 mb-6"
            : "text-2xl font-semibold text-gray-700 mt-8 mb-4"
        return <h1 className={headingClasses}>{item.children[0].text}</h1>
      case "paragraph":
        return <p className="text-gray-600 mb-4">{item.children[0].text}</p>
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900">{Hero}</h1>
          <div className="h-28">
            <Image
              src={`http://localhost:1337${Cover.data.attributes.url}`}
              height={Cover.data.attributes.height}
              width={Cover.data.attributes.width}
              alt={Cover.data.attributes.alternativeText || Hero}
              quality={100}
            />
          </div>
        </header>
        <main className="bg-white shadow-lg rounded-lg p-8">
          {Body.map((item, index) => (
            <React.Fragment key={index}>{renderContent(item)}</React.Fragment>
          ))}
        </main>
      </div>
    </div>
  )
}

export default async function Page() {
  const data = await fetch(API_ROUTE, { cache: "no-store" }).then((data) =>
    data.json()
  )
  console.log("DATA:")
  console.log(data)
  const content = data as HomepageResponse

  return (
    <main className="flex min-h-screen flex-col p-6">
      <p
        className={clsx(
          lusitana.className,
          `text-xl text-gray-800 md:text-3xl md:leading-normal`
        )}
      >
        test
      </p>
      <Homepage data={content} />
    </main>
  )
}

// export const getStaticProps: GetStaticProps<HomepageProps> = async () => {
//   // In a real application, you'd fetch this data from an API
//   const data: HomepageResponse = {
//     // ... (your data object)
//   };

//   return {
//     props: {
//       data
//     },
//   };
// };
