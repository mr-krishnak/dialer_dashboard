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
import JsSIP from "jssip";

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
    const [modalVisible, setModalVisible] = useState(false);
    const [sipUri, setSipUri] = useState("");

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
            extraHeaders: [ 'X-Foo: foo', 'X-Bar: bar' ],
            // contact_uri: 'sip:1010@voip-76.gigonomy.in;X-Ast-Orig-Host=192.168.2.99',
            // Other JsSIP configurations if needed
        };

        const phone = new JsSIP.UA(configuration);

        phone.on("registered", () => {
            console.log("Registered successfully");
        });

        phone.on("unregistered", () => {
            console.log("Unregistered successfully");
        });

        phone.on("registrationFailed", (e) => {
            console.error("Registration failed:", e.cause);
        });

        phone.on("newRTCSession", (e) => {
            const session = e.session;

            if (session.direction === "incoming") {
                setIncomingCall(session);
                setModalVisible(true);
            }

            session.on("ended", () => {
                setActiveCall(null);
                setIsOnHold(false);
            });

            session.on("failed", () => {
                setActiveCall(null);
                setIsOnHold(false);
            });
        });

        setUa(phone);

        return () => {
            if (phone) {
                phone.stop();
            }
        };
    }, []);

    const handleSwitchChange = async (e) => {
        const checked = e.target.checked;
        setIsRegistered(checked);

        if (checked && ua && hasMicPermission) {
            ua.start();
        } else if (ua) {
            ua.stop();
        }
    };

    const handleAcceptCall = () => {
        if (incomingCall) {
            incomingCall.answer({
                mediaConstraints: { audio: true, video: false },
            });
            setActiveCall(incomingCall);
            setModalVisible(false);
        }
    };

    const handleRejectCall = () => {
        if (incomingCall) {
            incomingCall.terminate();
            setIncomingCall(null);
            setModalVisible(false);
        }
    };

    const handleHangupCall = () => {
        if (activeCall) {
            activeCall.terminate();
            setActiveCall(null);
            setIsOnHold(false);
        }
    };

    const handleCall = () => {
        if (ua && sipUri) {
            const options = {
                mediaConstraints: { audio: true, video: false },
            };
            const newSipUri = sipUri + "@" + baseURI;
            const session = ua.call(sipUri, options);

            setActiveCall(session);

            session.on("ended", () => {
                setActiveCall(null);
                setIsOnHold(false);
            });

            session.on("failed", () => {
                setActiveCall(null);
                setIsOnHold(false);
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
                <NavbarItem className="hidden lg:flex">
                    <Input
                        placeholder="Emter Phone Number"
                        value={sipUri}
                        onChange={(e) => setSipUri(e.target.value)}
                    />
                    <Button
                        color="primary"
                        onClick={handleCall}
                        disabled={!isRegistered || !hasMicPermission}
                    >
                        Call
                    </Button>
                </NavbarItem>
                <NavbarItem className="hidden lg:flex">
                    <Switch
                        checked={isRegistered}
                        onChange={handleSwitchChange}
                        color="primary"
                    />
                    {activeCall && (
                        <>
                            <Button color="danger" onClick={handleHangupCall}>
                                Hang Up
                            </Button>
                            <Button color="warning" onClick={handleHoldCall}>
                                {isOnHold ? "Resume" : "Hold"}
                            </Button>
                        </>
                    )}
                    <Modal
                        closeButton
                        aria-labelledby="modal-title"
                        isOpen={modalVisible}
                        onClose={handleRejectCall}
                    >
                        <ModalHeader>Incoming Call</ModalHeader>
                        <ModalBody>
                            You have an incoming call. Do you want to accept it?
                        </ModalBody>
                        <ModalFooter>
                            <Button color="danger" onClick={handleRejectCall}>
                                Reject
                            </Button>
                            <Button onClick={handleAcceptCall}>Accept</Button>
                        </ModalFooter>
                    </Modal>
                </NavbarItem>
                <NavbarItem className="hidden lg:flex">
                    {isRegistered
                        ? activeCall
                            ? "Active Call"
                            : "Registered"
                        : "Unregistered"}
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
