"use client";

// import Link from "next/link";
import { useEffect, useState } from "react";
import { GoogleMap, InfoWindow, LoadScript, Marker } from "@react-google-maps/api";
import type { NextPage } from "next";
import { parseEther, zeroAddress } from "viem";
import { generatePrivateKey } from "viem/accounts";
import { privateKeyToAddress } from "viem/accounts";
import { useAccount } from "wagmi";
// import { Popup } from "~~/components/Popup";
import { useScaffoldContract, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const Home: NextPage = () => {
  const mapContainerStyle = {
    width: "100%",
    height: "650px",
  };

  const center = {
    lat: 39.78597, // Latitude of your map center
    lng: -101.58847, // Longitude of your map center
  };

  const locations = [
    {
      id: 1,
      position: { lat: 39.78597, lng: -101.58847 },
      title: "United States",
      address: "0xc0f0E1512D6A0A77ff7b9C172405D1B0d73565Bf",
      humanCount: 132,
    },
    {
      id: 2,
      position: { lat: 20.59, lng: 78.96 },
      title: "India",
      address: zeroAddress,
      humanCount: 132,
    },
    {
      id: 3,
      position: { lat: 2.218, lng: 115.6628 },
      title: "Southeast Asia",
      address: zeroAddress,
      humanCount: 132,
    },
    {
      id: 4,
      position: { lat: 8.7832, lng: 34.5085 },
      title: "Africa",
      address: zeroAddress,
      humanCount: 132,
    },
    {
      id: 5,
      position: { lat: -10.235, lng: 304.0747 },
      title: "Latin America",
      address: "0x4827cc52e3Ee63f8116B599352d30E7e6dC9BaEC",
      humanCount: 132,
    },
  ];

  const { address: connectedAddress } = useAccount();

  const [selectedMarker, setSelectedMarker] = useState<any>(null);

  const { data: isUserAligned, refetch: refetchIsUserAligned } = useScaffoldReadContract({
    contractName: "YourContractManager",
    functionName: "getIsUserAligned",
    args: [connectedAddress],
  });

  const { data: userAlignedLocations } = useScaffoldReadContract({
    contractName: "YourContractManager",
    functionName: "getUserLocations",
    args: [connectedAddress],
  });

  console.log(userAlignedLocations);

  const [locationScores, setLocationScores] = useState<{ [key: string]: number }>({});

  const { data: yourContractManager } = useScaffoldContract({
    contractName: "YourContractManager",
  });

  useEffect(() => {
    const fetchLocationScores = async () => {
      if (!yourContractManager || !userAlignedLocations) return;

      const scores: { [key: string]: number } = {};
      for (const location of locations) {
        const score = await yourContractManager.read.getLocationAlignmentScore([location.address]);
        scores[location.address] = Number(score);
      }
      setLocationScores(scores);
    };

    fetchLocationScores();
  }, [yourContractManager?.address, userAlignedLocations?.length]);

  const { data: isUserAlignedWithCountry } = useScaffoldReadContract({
    contractName: "YourContract",
    functionName: "getUserAlignmentWithCountry",
    args: [selectedMarker?.address, connectedAddress],
  });

  const { writeContractAsync: writeYourContractManagerAsync } = useScaffoldWriteContract("YourContractManager");

  console.log(isUserAligned);

  const [isOpen, setIsOpen] = useState(false);

  const togglePopup = () => {
    setIsOpen(!isOpen);
  };

  const [generatedPrivateKey, setGeneratedPrivateKey] = useState<any>(undefined);
  const [generatedPublicKey, setGeneratedPublicKey] = useState<any>(undefined);

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
              <div className="p-4 text-center bg-base-300 m-4 rounded-lg">
                <h2 className="text-4xl">{selectedMarker.title}</h2>
                <p className="text-6xl">{locationScores[selectedMarker.address]}</p>
                {/* {selectedMarker.humanCount}</p> */}

                {isUserAlignedWithCountry ? (
                  <>
                    <p className="text-green-600 text-2xl">You are Based with this country!</p>
                  </>
                ) : (
                  <>
                    <button
                      className="btn btn-primary w-[150px]"
                      onClick={async () => {
                        console.log("aligning for " + selectedMarker?.address);

                        await writeYourContractManagerAsync({
                          functionName: "addAlignment",
                          value: parseEther("0.1"),
                          args: [selectedMarker?.address],
                        });

                        await refetchIsUserAligned();
                      }}
                    >
                      {"Get Based"}
                    </button>
                  </>
                )}
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </LoadScript>
      <div className="flex flex-wrap items-center justify-center gap-10">
        <div>
          <p className="text-center">{"You are Based in: "}</p>

          <p className="text-center">
            {userAlignedLocations
              ?.map((location: any) => locations.find(marker => marker.address === location)?.title)
              .join(", ")}
          </p>
        </div>

        <div>
          <p className="text-center">{"Don't see your country?"}</p>
          <button
            className="btn btn-lg btn-primary w-[150px]"
            onClick={async () => {
              const privateKey = generatePrivateKey();
              const account = privateKeyToAddress(privateKey);

              setGeneratedPrivateKey(privateKey);
              setGeneratedPublicKey(account);
              togglePopup();
              console.log(privateKey);
              console.log(account);
            }}
          >
            {"Add it!"}
          </button>
        </div>
      </div>

      {isOpen && (
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
      )}

      {locations.map((location, index) => (
        <div key={index} className="bg-primary shadow-md rounded-lg p-4 m-2">
          <h3 className="text-xl font-semibold">{location.title}</h3>
          <p className="text-lg">Score: {locationScores[location.address]}</p>
        </div>
      ))}
    </>
  );
};

export default Home;
