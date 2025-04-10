import { useEffect, useState } from "react";
import { GoogleMap, InfoWindow, LoadScript, Marker } from "@react-google-maps/api";
import { formatEther } from "viem";
// import { generatePrivateKey } from "viem/accounts";
// import { privateKeyToAddress } from "viem/accounts";
import { useAccount } from "wagmi";
import { useScaffoldContract, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { locations } from "~~/locations.config";

const center = {
  lat: 39.78597, // Latitude of your map center
  lng: -101.58847, // Longitude of your map center
};

export function Map() {
  const [mapHeight, setMapHeight] = useState(650);

  const mapContainerStyle = {
    width: "100%",
    height: `${mapHeight}px`,
  };

  useEffect(() => {
    const handleResize = () => {
      // Check if window width is less than typical mobile breakpoint (768px)
      setMapHeight(window.innerWidth < 768 ? 450 : 650);
    };

    // Set initial height
    handleResize();

    // Add event listener for window resize
    window.addEventListener("resize", handleResize);

    // Clean up event listener on component unmount
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const { address: connectedAddress } = useAccount();

  const [selectedMarker, setSelectedMarker] = useState<any>(null);

  //   const { data: isUserAligned, refetch: refetchIsUserAligned } = useScaffoldReadContract({
  //     contractName: "YourContractManager",
  //     functionName: "getIsUserAligned",
  //     args: [connectedAddress],
  //   });

  const { data: userAlignedLocations } = useScaffoldReadContract({
    contractName: "AlignmentManager",
    functionName: "getUserAlignments",
    args: [connectedAddress],
  });

  const { data: alignmentCost } = useScaffoldReadContract({
    contractName: "AlignmentManager",
    functionName: "getAlignmentCost",
  });

  const [locationScores, setLocationScores] = useState<{ [key: string]: number }>({});

  const { data: alignmentManager } = useScaffoldContract({
    contractName: "AlignmentManager",
  });

  useEffect(
    () => {
      const fetchLocationScores = async () => {
        if (!alignmentManager || !userAlignedLocations) return;

        const scores: { [key: string]: number } = {};
        for (const location of locations) {
          const score = await alignmentManager.read.getEntityAlignmentScore([location.address]);
          scores[location.address] = Number(score);
        }
        setLocationScores(scores);
      };

      fetchLocationScores();
    },
    // eslint-disable-next-line
    [alignmentManager?.address, userAlignedLocations?.length],
  );

  const { data: isUserAlignedWithEntity } = useScaffoldReadContract({
    contractName: "Alignment",
    functionName: "getUserAlignmentWithEntity",
    args: [selectedMarker?.address, connectedAddress],
  });

  const { writeContractAsync: writeAlignmentManagerAsync } = useScaffoldWriteContract("AlignmentManager");

  //   const [isOpen, setIsOpen] = useState(false);

  //   const togglePopup = () => {
  //     setIsOpen(!isOpen);
  //   };

  //   const [generatedPrivateKey, setGeneratedPrivateKey] = useState<any>(undefined);
  //   const [generatedPublicKey, setGeneratedPublicKey] = useState<any>(undefined);

  return (
    <>
      <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_API_KEY || ""}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={4} //options={{ styles: customMapStyle }}//
        >
          {locations.map(marker => (
            <Marker
              key={marker.id}
              position={marker.position}
              onClick={() => setSelectedMarker(marker)} // Show InfoWindow on click
            />
          ))}

          {selectedMarker && (
            <InfoWindow
              position={selectedMarker.position}
              onCloseClick={() => setSelectedMarker(null)} // Close InfoWindow on click
            >
              <div className="p-4 text-center bg-base-300 m-4 rounded-lg items-center flex justify-center flex-col">
                <h2 className="m-0 text-xl md:text-4xl">{selectedMarker.title}</h2>
                <p className="m-0 text-2xl md:text-6xl">{locationScores[selectedMarker.address]}</p>
                {/* {selectedMarker.humanCount}</p> */}

                {isUserAlignedWithEntity ? (
                  <>
                    <p className="text-green-600 text-2xl">You are Based with this country!</p>
                  </>
                ) : (
                  <>
                    <button
                      className="btn btn-primary w-44 flex flex-col"
                      onClick={async () => {
                        await writeAlignmentManagerAsync({
                          functionName: "addAlignment",
                          value: alignmentCost,
                          args: [selectedMarker?.address],
                        });

                        // await refetchIsUserAligned();
                      }}
                    >
                      <p className="m-0 p-0">{`Get Based`}</p>
                      <p className="m-0 p-0">{`(${formatEther(alignmentCost || BigInt(0))} ETH)`}</p>
                    </button>
                  </>
                )}
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </LoadScript>
      <div className="flex flex-wrap items-center justify-center gap-10 bg-primary">
        <div>
          <p className="text-center">{"You are Based in: "}</p>

          <p className="text-center">
            {userAlignedLocations
              ?.map((location: any) => locations.find(marker => marker.address === location)?.title)
              .join(", ")}
          </p>
        </div>

        {/* <div>
          <p className="text-center">{"Don't see your country?"}</p>
          <button
            className="btn btn-lg btn-secondary w-[150px]"
            onClick={async () => {
              const privateKey = generatePrivateKey();
              const account = privateKeyToAddress(privateKey);

              setGeneratedPrivateKey(privateKey);
              setGeneratedPublicKey(account);
              togglePopup();
            }}
          >
            {"Add it!"}
          </button>
        </div> */}
      </div>

      {/* {isOpen && (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center overflow-y-auto">
          <div className="bg-base-100 p-6 rounded-lg w-full text-center shadow-lg w-[800px] mt-10 mb-10">
            <p className="m-0">Private Key</p>
            <p className="m-0">{generatedPrivateKey}</p>
            <p className="m-0">Public Key</p>
            <p className="m-0">{generatedPublicKey}</p>

            <div className="mt-10">
              <p className="text-xl">Please provide the PUBLIC key to the site admin</p>
              <p className="text-xl">SAVE THE PRIVATE KEY SOMEWHERE SAFE</p>
              <p className="text-xl text-rose-900">DO NOT SHARE THE PRIVATE KEY WITH ANYONE ELSE</p>

              <button className="btn btn-primary w-[150px]" onClick={togglePopup}>
                {"Close"}
              </button>
            </div>
          </div>
        </div>
      )} */}
    </>
  );
}
