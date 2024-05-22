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
    Switch,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Input,
} from "@nextui-org/react";
// import useSipClient from "../lib/useSipClient";

import {
    UserAgent,
    Registerer,
    Inviter,
    Invitation,
    RegistererState,
} from "sip.js";
const BaseURL = "voip-76.gigonomy.in";
const SIP_URI = "sip:1010@voip-76.gigonomy.in";
const SIP_SERVER = "wss://voip-76.gigonomy.in:10076/ws"; // Ensure your Asterisk is using the correct WebSocket URL
const SIP_USER = "1010";
const SIP_PASSWORD = "1010";

const TopNavBar = () => {
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

    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    const [userAgent, setUserAgent] = useState(null);
    const [hasMicPermission, setHasMicPermission] = useState(false);
    const [registerer, setRegisterer] = useState(null);
    const [session, setSession] = useState(null);
    const [registered, setRegistered] = useState(false);
    const [target, setTarget] = useState("");
    const [incomingCall, setIncomingCall] = useState(null);
    const [isOnHold, setIsOnHold] = useState(false);

    useEffect(() => {
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

        if (userAgent) {
            userAgent.delegate = {
                onInvite: (invitation) => {
                    setIncomingCall(invitation);
                },
                onCallCreated: (session) => {
                    console.log(session);
                },
                onCallAnswered: (session) => {
                    console.log(session);
                },
                onCallHangup: (session) => {
                    console.log(session);
                },
                onCallHold: (session) => {
                    console.log(session);
                },
                onCallResume: (session) => {
                    console.log(session);
                },
            };
        }
    }, [userAgent]);

    const handleRegister = async () => {
        const uri = UserAgent.makeURI(SIP_URI);
        const transportOptions = {
            server: SIP_SERVER,
            tracetraceSip: false,
        };
        const userAgentOptions = {
            logConfiguration: false,
            uri,
            transportOptions,
            authorizationUsername: SIP_USER,
            authorizationPassword: SIP_PASSWORD,
            sessionDescriptionHandlerFactoryOptions: {
                constraints: {
                    audio: true,
                    video: false,
                },
                peerConnectionConfiguration: {
                    bundlePolicy: "balanced",
                    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
                    iceTransportPolicy: "all",
                    rtcpMuxPolicy: "require",
                },
                peerConnectionOptions: {
                    rtcConfiguration: {
                        sdpSemantics: "unified-plan",
                        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
                    },
                    iceCheckingTimeout: 3000,
                },
            },
            hackIpInContact: true,
            autoStart: false,
            autoStop: true,
            register: false,
            contactParams: {},
            delegate: {
                onInvite: function (sip) {
                    setIncomingCall(sip);
                },
            },
        };

        const ua = new UserAgent(userAgentOptions);
        const registerer = new Registerer(ua);

        ua.start()
            .then(() => {
                registerer
                    .register()
                    .then(() => {
                        console.log("Registered successfully");
                        setRegistered(true);
                    })
                    .catch((error) =>
                        console.error("Registration failed", error)
                    );
            })
            .catch((error) => console.error("User agent start failed", error));

        setUserAgent(ua);
        setRegisterer(registerer);
    };
    const sdpOptions = {
        earlyMedia: true,
        sessionDescriptionHandlerOptions: {
            constraints: {
                audio: {
                    // deviceId: "default",
                    autoGainControl: true,
                    echoCancellation: true,
                    noiseSuppression: true,
                },
                video: false,
            },
        },
    };

    const handleCall = () => {
        if (!userAgent || !target) return;

        const targetURI = UserAgent.makeURI(`sip:${target}@${BaseURL}`);
        const inviter = new Inviter(userAgent, targetURI);

        inviter.invite().then((session) => {
            setSession(session);
            session.delegate = {
                sessionDescriptionHandler: (sessionDescriptionHandler) => {
                    console.log(sessionDescriptionHandler);
                },
            };
        }).catch((error) => {
            console.error("Failed to invite", error);
        });


        // sipSession.data.calldirection = "outbound";
        // sipSession.data.dst = target;
        // sipSession.data.terminateby = "them";
        // sipSession.delegate = {
        //     onBye: function (sip) {
        //         onSessionReceivedBye(sip);
        //     },
        //     onMessage: function (sip) {
        //         onSessionReceivedMessage(sip);
        //     },
        //     onInvite: function (sip) {
        //         onSessionReinvited(sip);
        //     },
        // };
        // var inviterOptions = {
        //     requestDelegate: {
        //         // OutgoingRequestDelegate
        //         onTrying: function (sip) {
        //             onInviteTrying(sip);
        //         },
        //         onProgress: function (sip) {
        //             onInviteProgress(sip);
        //         },
        //         onRedirect: function (sip) {
        //             onInviteRedirected(sip);
        //         },
        //         onAccept: function (sip) {
        //             onInviteAccepted(false, sip);
        //         },
        //         onReject: function (sip) {
        //             onInviteRejected(sip);
        //         },
        //     },
        // };

        // sipSession
        //     .invite(inviterOptions)
        //     .then((session) => {
        //         console.log("Call initiated", session);
        //         setSession(session);
        //         session.delegate = {
        //             sessionDescriptionHandler: (sessionDescriptionHandler) => {
        //                 console.log(sessionDescriptionHandler);
        //             },
        //         };
        //         // addSessionEventHandlers(session);
        //     })
        //     .catch(function (e) {
        //         console.warn("Failed to send INVITE:", e);
        //     });
    };

    const answerSDPOptions = {
        earlyMedia: true,
        sessionDescriptionHandlerOptions: {
            constraints: {
                audio: {
                    // deviceId: "default",
                    autoGainControl: true,
                    echoCancellation: true,
                    noiseSuppression: true,
                },
                video: false,
            },
        },
    };
    const handleAnswer = () => {
        if (incomingCall) {
            incomingCall
                .accept(answerSDPOptions)
                .then(() => {
                    console.log(incomingCall);
                    setSession(incomingCall);
                    incomingCall.delegate = {
                        onSessionDescriptionHandler: (
                            sessionDescriptionHandler
                        ) => {
                            sessionDescriptionHandler.on(
                                "setDescription",
                                () => {
                                    console.log("Call SDP set");
                                    // handleHoldResumeButtonVisibility(incomingCall);
                                }
                            );
                        },
                    };
                    setIncomingCall(null);
                    // addSessionEventHandlers(incomingCall);
                })
                .catch((error) => console.error("Answer failed", error));
        }
    };

    const handleHangup = () => {
        if (session) {
            session
                .bye()
                .then(() => {
                    console.log("Call ended");
                    setSession(null);
                })
                .catch((error) => console.error("Hangup failed", error));
            // console.log("Call ended");
            // setSession(null);
        }
    };

    const handleHold = () => {
        console.log(session);

        if (session) {
            if (session.isOnHold == true) {
                console.log("Call is is already on hold:", session);
                setIsOnHold(true);
                return;
            }
            let sessionDescriptionHandlerOptions =
                session.sessionDescriptionHandlerOptionsReInvite;
            sessionDescriptionHandlerOptions.hold = true;
            session.sessionDescriptionHandlerOptionsReInvite =
                sessionDescriptionHandlerOptions;

            let options = {
                requestDelegate: {
                    onAccept: function () {
                        if (
                            session &&
                            session.sessionDescriptionHandler &&
                            session.sessionDescriptionHandler.peerConnection
                        ) {
                            setIsOnHold(true);
                            let pc =
                                session.sessionDescriptionHandler
                                    .peerConnection;
                            // Stop all the inbound streams
                            pc.getReceivers().forEach(function (
                                RTCRtpReceiver
                            ) {
                                if (RTCRtpReceiver.track)
                                    RTCRtpReceiver.track.enabled = false;
                            });
                            // Stop all the outbound streams (especially useful for Conference Calls!!)
                            pc.getSenders().forEach(function (RTCRtpSender) {
                                // Mute Audio
                                if (
                                    RTCRtpSender.track &&
                                    RTCRtpSender.track.kind == "audio"
                                ) {
                                    if (
                                        RTCRtpSender.track.IsMixedTrack == true
                                    ) {
                                        if (
                                            session.data.AudioSourceTrack &&
                                            session.data.AudioSourceTrack
                                                .kind == "audio"
                                        ) {
                                            console.log(
                                                "Muting Mixed Audio Track : " +
                                                    session.data
                                                        .AudioSourceTrack.label
                                            );
                                            session.data.AudioSourceTrack.enabled =
                                                false;
                                        }
                                    }
                                    console.log(
                                        "Muting Audio Track : " +
                                            RTCRtpSender.track.label
                                    );
                                    RTCRtpSender.track.enabled = false;
                                }
                            });
                        }
                        session.isOnHold = true;
                        console.log("Call is is on hold:", session);
                    },
                    onReject: function () {
                        session.isOnHold = false;
                        console.warn(
                            "Failed to put the call on hold:",
                            session
                        );
                    },
                },
            };
            session.invite(options).catch(function (error) {
                session.isOnHold = false;
                console.warn(
                    "Error attempting to put the call on hold:",
                    error
                );
            });
        }
    };

    const handleResume = () => {
        if (session) {
            if (session.isOnHold == false) {
                console.log("Call is already off hold:", session);
                setIsOnHold(false);
                return;
            }

            session.isOnHold = false;

            let sessionDescriptionHandlerOptions =
                session.sessionDescriptionHandlerOptionsReInvite;
            sessionDescriptionHandlerOptions.hold = false;
            session.sessionDescriptionHandlerOptionsReInvite =
                sessionDescriptionHandlerOptions;

            let options = {
                requestDelegate: {
                    onAccept: function () {
                        if (
                            session &&
                            session.sessionDescriptionHandler &&
                            session.sessionDescriptionHandler.peerConnection
                        ) {
                            setIsOnHold(false);
                            let pc =
                                session.sessionDescriptionHandler
                                    .peerConnection;
                            // Restore all the inbound streams
                            pc.getReceivers().forEach(function (
                                RTCRtpReceiver
                            ) {
                                if (RTCRtpReceiver.track)
                                    RTCRtpReceiver.track.enabled = true;
                            });
                            // Restore all the outbound streams
                            pc.getSenders().forEach(function (RTCRtpSender) {
                                // Unmute Audio
                                if (
                                    RTCRtpSender.track &&
                                    RTCRtpSender.track.kind == "audio"
                                ) {
                                    if (
                                        RTCRtpSender.track.IsMixedTrack == true
                                    ) {
                                        if (
                                            session.data.AudioSourceTrack &&
                                            session.data.AudioSourceTrack
                                                .kind == "audio"
                                        ) {
                                            console.log(
                                                "Unmuting Mixed Audio Track : " +
                                                    session.data
                                                        .AudioSourceTrack.label
                                            );
                                            session.data.AudioSourceTrack.enabled =
                                                true;
                                        }
                                    }
                                    console.log(
                                        "Unmuting Audio Track : " +
                                            RTCRtpSender.track.label
                                    );
                                    RTCRtpSender.track.enabled = true;
                                }
                            });
                        }
                        session.isOnHold = false;
                        console.log("Call is off hold:", session);
                    },
                    onReject: function () {
                        session.isOnHold = true;
                        console.warn("Failed to put the call on hold", session);
                    },
                },
            };
            session.invite(options).catch(function (error) {
                session.isOnHold = true;
                console.warn(
                    "Error attempting to take to call off hold",
                    error
                );
            });
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
                {!registered ? (
                    <Button onClick={handleRegister}>Register</Button>
                ) : (
                    <>
                        <NavbarItem className="hidden lg:flex">
                            {incomingCall && (
                                <Button onClick={handleAnswer}>Answer</Button>
                            )}
                            {session ? (
                                <>
                                    {isOnHold ? (
                                        <Button onClick={handleResume}>
                                            Resume
                                        </Button>
                                    ) : (
                                        <Button onClick={handleHold}>
                                            Hold
                                        </Button>
                                    )}
                                    <Button
                                        color="danger"
                                        onClick={handleHangup}
                                    >
                                        Hang Up
                                    </Button>
                                </>
                            ) : (
                                !incomingCall && (
                                    <>
                                        <Input
                                            placeholder="Emter Phone Number"
                                            value={target}
                                            onChange={(e) =>
                                                setTarget(e.target.value)
                                            }
                                        />
                                        <Button
                                            color="primary"
                                            onClick={handleCall}
                                        >
                                            Call
                                        </Button>
                                    </>
                                )
                            )}
                        </NavbarItem>
                    </>
                )}
                <NavbarItem className="hidden lg:flex">
                    {session ? "On Call" : "Registerd"}
                </NavbarItem>
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
