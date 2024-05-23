"use client";

import React, { useState, useEffect } from "react";
import {
    Navbar,
    NavbarBrand,
    NavbarMenuToggle,
    NavbarMenuItem,
    NavbarMenu,
    NavbarContent,
    NavbarItem,
    Link,
    Button,
    Input,
} from "@nextui-org/react";
import JsSIP from "jssip";

//Top Navigarion Bar
const TopNavBar = () => {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    const menuItems = [
        "Profile",
        "Dashboard",
        "Activity",
        "Analytics",
        "System",
        "Deployments",
        "My Settings",
        "Team Settings",
        "Help & Feedback",
        "Log Out",
    ];

    const baseURI = "voip-76.gigonomy.in";

    const [isRegistered, setIsRegistered] = useState(false);
    const [hasMicPermission, setHasMicPermission] = useState(false);
    const [ua, setUa] = useState(null);
    const [incomingCall, setIncomingCall] = useState(null);
    const [activeCall, setActiveCall] = useState(null);
    const [isOnHold, setIsOnHold] = useState(false);
    const [answerCallBtn, setAnswerCallBtn] = useState(false);
    const [sipUri, setSipUri] = useState("");

    const rtcAnswerConstraints = {
        mandatory: {
            OfferToReceiveAudio: true,
            OfferToReceiveVideo: false,
        },
    };

    const rtcOfferConstraints = {
        mandatory: {
            OfferToReceiveAudio: true,
            OfferToReceiveVideo: false,
        },
    };

    useEffect(() => {
        // Function to check and request microphone permission
        const checkAndRequestMicPermission = async () => {
            try {
                const permissionStatus = await navigator.permissions.query({
                    name: "microphone",
                });

                if (permissionStatus.state === "granted") {
                    setHasMicPermission(true);
                } else {
                    await navigator.mediaDevices.getUserMedia({ audio: true });
                    setHasMicPermission(true);
                }

                permissionStatus.onchange = () => {
                    setHasMicPermission(permissionStatus.state === "granted");
                };
            } catch (error) {
                console.error(
                    "Error checking/requesting microphone permission:",
                    error
                );
                setHasMicPermission(false);
            }
        };

        checkAndRequestMicPermission();

        // JsSIP Configuration
        const socket = new JsSIP.WebSocketInterface(
            "wss://voip-76.gigonomy.in:10076/ws"
        );

        const configuration = {
            sockets: [socket],
            uri: "sip:1010@voip-76.gigonomy.in",
            password: "1010",
            realm:'voip-76.gigonomy.in',
            display_name:'1010',
            contact_uri: 'sip:1010@192.168.2.161:10076',
        };

        const phone = new JsSIP.UA(configuration);

        phone.on("registered", () => {
            setIsRegistered(true);
            console.log("Registered successfully");
        });

        phone.on("unregistered", () => {
            setIsRegistered(false);
            console.log("Unregistered successfully");
        });

        phone.on("registrationFailed", (e) => {
            console.error("Registration failed:", e.cause);
        });

        phone.on("newRTCSession", (e) => {
            const sipSession = e.session;

            if (sipSession.direction === "incoming") {
                setIncomingCall(sipSession);
                setAnswerCallBtn(true);
            }

            sipSession.on("confirmed", () => {
                setActiveCall(sipSession);
                setIsOnHold(false);
            });

            sipSession.on("ended", () => {
                console.log("end");
                setActiveCall(null);
                setIsOnHold(false);
            });

            sipSession.on("failed", () => {
                console.log("failed");
                setActiveCall(null);
                setIsOnHold(false);
                setAnswerCallBtn(false);
            });

            sipSession.on("peerconnection", () => {
                console.log("peerconnection", sipSession);
                sipSession.connection.ontrack = (event) => {
                    const remoteStream = event.streams[0];
                    // Attach the remote stream to an audio element to listen to the hold music
                    const audioElement = document.getElementById("remoteAudio");
                    if (audioElement) {
                        audioElement.srcObject = remoteStream;
                    }
                };

                sipSession.on("hold", () => {
                    console.log("Call is on hold");
                    setIsOnHold(true);
                });

                sipSession.on("unhold", () => {
                    console.log("Call is resumed");
                    setIsOnHold(false);
                });
            });
        });

        setUa(phone);

        return () => {
            if (phone) {
                phone.stop();
            }
        };
    }, []);

    const handleRegister = () => {
        if (ua && hasMicPermission) {
            ua.start();
        }
    };
    const handleUnregister = () => {
        if (ua) {
            ua.stop();
        }
    };

    const handleAcceptCall = () => {
        if (incomingCall) {
            incomingCall.answer({
                mediaConstraints: {
                    audio: {
                        mandatory: {
                            googEchoCancellation: true,
                            googAutoGainControl: true,
                            googNoiseSuppression: true,
                            googHighpassFilter: true,
                        },
                    },
                    video: false,
                },
                rtcAnswerConstraints,
            });
            setActiveCall(incomingCall);
            setAnswerCallBtn(false);
        }
    };

    const handleRejectCall = () => {
        if (incomingCall) {
            incomingCall.terminate();
            setIncomingCall(null);
            setAnswerCallBtn(false);
        }
    };

    const handleHangupCall = () => {
        if (activeCall) {
            activeCall.terminate();
            setActiveCall(null);
            setIsOnHold(false);
        }
    };

    var eventHandlers = {
        progress: function (e) {
            /* Your code here */
            console.log("progress", e);
        },
        failed: function (e) {
            /* Your code here */
            console.log("failed", e);
        },
        confirmed: function (e) {
            console.log("confirmed", e);
        },
        ended: function (e) {
            /* Your code here */
            console.log("ended", e);
        },
    };

    const handleCall = () => {
        if (ua && sipUri) {
            const options = {
                eventHandlers: eventHandlers,
                mediaConstraints: {
                    audio: {
                        mandatory: {
                            googEchoCancellation: true,
                            googAutoGainControl: true,
                            googNoiseSuppression: true,
                            googHighpassFilter: true,
                        },
                    },
                    video: false,
                },
                rtcOfferConstraints,
                rtcAnswerConstraints,
                pcConfig: {
                    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
                    rtcpMuxPolicy: "require",
                    bundlePolicy: "max-bundle",
                },
                sdpSemantics: "unified-plan",
            };
            const newSipUri = sipUri + "@" + baseURI;
            const sipSession = ua.call(newSipUri, options);

            if (sipSession) {
                sipSession.connection.addEventListener("addstream", (e) => {
                    const remoteStream = e.stream;
                    const audioElement = document.getElementById("remoteAudio");
                    if (audioElement) {
                        audioElement.srcObject = remoteStream;
                    }
                });
            }

            setActiveCall(sipSession);

            sipSession.on("ended", (evt) => {
                console.log("Session ended", evt);
                setActiveCall(null);
                setIsOnHold(false);
            });

            sipSession.on("failed", (evt) => {
                console.log("Session failed", evt);
                setActiveCall(null);
                setIsOnHold(false);
            });

            sipSession.on("accepted", (evt) => {
                console.log("Session accepted", evt);
            });

            sipSession.on("confirmed", (evt) => {
                console.log("Session confirmed", sipSession);
            });

            sipSession.on("hold", (evt) => {
                console.log("Session is hold");
            });

            sipSession.on("unhold", (evt) => {
                console.log("Session is resumed");
            });
        }
    };

    const handleHoldCall = () => {
        if (activeCall) {
            if (isOnHold) {
                activeCall.unhold();
            } else {
                activeCall.hold();
            }
            setIsOnHold(!isOnHold);
        }
    };

    return (
        <Navbar
            isBordered
            isMenuOpen={isMenuOpen}
            onMenuOpenChange={setIsMenuOpen}
            maxWidth="full"
        >
            <NavbarContent className="sm:hidden" justify="start">
                <NavbarMenuToggle
                    aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                />
            </NavbarContent>

            <NavbarContent className="sm:hidden pr-3" justify="center">
                <NavbarBrand>
                    <p className="font-bold text-inherit">ACME</p>
                </NavbarBrand>
            </NavbarContent>

            <NavbarContent className="hidden sm:flex gap-4" justify="start">
                <NavbarBrand>
                    <p className="font-bold text-inherit">ACME</p>
                </NavbarBrand>
                <NavbarItem>
                    <Link color="foreground" href="/admin/dashboard">
                        Dashboard
                    </Link>
                </NavbarItem>
                <NavbarItem isActive>
                    <Link href="/admin/reports" aria-current="page">
                        Reports
                    </Link>
                </NavbarItem>
                <NavbarItem>
                    <Link color="foreground" href="#">
                        Integrations
                    </Link>
                </NavbarItem>
                <NavbarItem>
                    <Link color="foreground" href="#">
                        Integrations
                    </Link>
                </NavbarItem>
                <NavbarItem>
                    <Link color="foreground" href="#">
                        Integrations
                    </Link>
                </NavbarItem>
            </NavbarContent>

            <NavbarContent justify="end">
                {isRegistered && !activeCall && !answerCallBtn && (
                    <NavbarItem className="hidden lg:flex">
                        <Input
                            placeholder="Emter Phone Number"
                            value={sipUri}
                            color="primary"
                            onChange={(e) => setSipUri(e.target.value)}
                        />
                        <Button
                            color="success"
                            onClick={handleCall}
                            disabled={!isRegistered || !hasMicPermission}
                        >
                            Call
                        </Button>
                    </NavbarItem>
                )}
                {activeCall && (
                    <>
                        <NavbarItem className="hidden lg:flex">
                            <Button color="danger" onClick={handleHangupCall}>
                                Hang Up
                            </Button>
                        </NavbarItem>
                        <NavbarItem className="hidden lg:flex">
                            <Button
                                color={isOnHold ? "success" : "warning"}
                                onClick={handleHoldCall}
                            >
                                {isOnHold ? "Resume" : "Hold"}
                            </Button>
                        </NavbarItem>
                        <audio id="remoteAudio" autoPlay></audio>
                    </>
                )}
                {answerCallBtn && (
                    <>
                        <NavbarItem className="hidden lg:flex">
                            <Button color="success" onClick={handleAcceptCall}>
                                Accept
                            </Button>
                        </NavbarItem>
                        <NavbarItem className="hidden lg:flex">
                            <Button color="danger" onClick={handleRejectCall}>
                                Reject
                            </Button>
                        </NavbarItem>
                    </>
                )}
                {!activeCall && !answerCallBtn && (
                    <NavbarItem className="hidden lg:flex">
                        {isRegistered ? (
                            <Button onClick={handleUnregister} color="primary">
                                Unregister Phone
                            </Button>
                        ) : (
                            <Button onClick={handleRegister} color="primary">
                                Register Phone
                            </Button>
                        )}
                    </NavbarItem>
                )}
                {activeCall && (
                    <NavbarItem className="hidden lg:flex">
                        Active Call
                    </NavbarItem>
                )}
                <NavbarItem className="hidden lg:flex">
                    <Link href="#">Login</Link>
                </NavbarItem>
                <NavbarItem>
                    <Button as={Link} color="warning" href="#" variant="flat">
                        Sign Up
                    </Button>
                </NavbarItem>
            </NavbarContent>

            <NavbarMenu>
                {menuItems.map((item, index) => (
                    <NavbarMenuItem key={`${item}-${index}`}>
                        <Link
                            className="w-full"
                            color={
                                index === 2
                                    ? "warning"
                                    : index === menuItems.length - 1
                                    ? "danger"
                                    : "foreground"
                            }
                            href="#"
                            size="lg"
                        >
                            {item}
                        </Link>
                    </NavbarMenuItem>
                ))}
            </NavbarMenu>
        </Navbar>
    );
};

export default TopNavBar;
