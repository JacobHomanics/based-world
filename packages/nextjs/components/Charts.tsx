import { useEffect, useState } from "react";
import { locations } from "../locations.config";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import { useScaffoldContract } from "~~/hooks/scaffold-eth";

export function Charts() {
  const { data: alignmentManagerContract } = useScaffoldContract({
    contractName: "AlignmentManagerV1",
  });

  const [locationScores, setLocationScores] = useState<{ [key: string]: number }>({});

  // Get contract address from scaffold data
  const alignmentManagerAddress = alignmentManagerContract?.address;

  useEffect(
    () => {
      const fetchLocationScores = async () => {
        if (!alignmentManagerAddress) return;

        const publicClient = createPublicClient({
          chain: base,
          transport: http("https://base-mainnet.g.alchemy.com/v2/KxBqE7ph5mmk766FOmr1JkVuPrvgowW9"),
        });

        try {
          const scores: { [key: string]: number } = {};

          for (const location of locations) {
            const score = await publicClient.readContract({
              address: alignmentManagerAddress,
              abi: alignmentManagerContract.abi,
              functionName: "getEntityAlignmentScore",
              args: [location.address],
            });

            scores[location.address] = Number(score);
          }

          setLocationScores(scores);
        } catch (error) {
          console.error("Error fetching location scores:", error);
        }
      };

      fetchLocationScores();
    },
    // eslint-disable-next-line
    [alignmentManagerAddress],
  );

  return (
    <>
      {locations.map((location, index) => (
        <div key={index} className="bg-primary shadow-md rounded-lg p-4 m-2">
          <h3 className="text-xl font-semibold">{location.title}</h3>
          <p className="text-lg">Score: {locationScores[location.address]}</p>
        </div>
      ))}
    </>
  );
}
