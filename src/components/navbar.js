import React, { useState } from "react";
import styled from "styled-components";
import { Link } from "gatsby";
import { EDUCATIONAL_SUBMENU, NAV_CONFIG } from "../config/app-configuration";

// Generate navigation items from configuration
const NAV_ITEMS = NAV_CONFIG.map((item) => ({
    label: item.label,
    url: item.path,
    isExternal: item.isExternal || false,
    ...(item.hasSubmenu && {
        children: EDUCATIONAL_SUBMENU.map((subItem) => ({
            label: subItem.label,
            url: `${item.submenuBase}${subItem.path}`,
            isExternal: false,
        })),
    }),
}));

const NavBar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const isAlwaysOpenSubmenus = true; // Set to true to keep submenus always open
    const [openSubmenus, setOpenSubmenus] = useState({});

    const toggleSidebar = () => setIsOpen(!isOpen);

    const toggleSubmenu = (index) => {
        setOpenSubmenus((prev) => ({
            ...prev,
            [index]: !prev[index],
        }));
    };

    // Universal link renderer
    const renderNavLink = (item, onClick = () => setIsOpen(false)) => {
        const LinkComponent = item.isExternal ? StyledExternalLink : StyledLink;
        const linkProps = item.isExternal
            ? { href: item.url, target: "_blank", rel: "noopener noreferrer" }
            : { to: item.url, activeClassName: "active", onClick };

        return <LinkComponent {...linkProps}>{item.label}</LinkComponent>;
    };

    const renderSubMenu = (children, index) => {
        if (!children || children.length === 0) return null;

        return (
            <SubMenuList isOpen={isAlwaysOpenSubmenus || openSubmenus[index]}>
                {children.map((child, childIndex) => (
                    <SubMenuListItem key={childIndex}>
                        {renderNavLink(child)}
                    </SubMenuListItem>
                ))}
            </SubMenuList>
        );
    };

    const renderSubToggle = (item, index) => {
        if (isAlwaysOpenSubmenus) {
            return renderNavLink(item);
        }

        return (
            <SubMenuToggle
                onClick={() => toggleSubmenu(index)}
                isOpen={openSubmenus[index]}
            >
                {item.label}
                <ArrowIcon isOpen={openSubmenus[index]}>▼</ArrowIcon>
            </SubMenuToggle>
        );
    };

    return (
        <>
            <HamburgerButton onClick={toggleSidebar} aria-label="Toggle menu">
                <HamburgerLines isOpen={isOpen}>
                    <span />
                    <span />
                    <span />
                </HamburgerLines>
            </HamburgerButton>

            <SidebarOverlay isOpen={isOpen} onClick={toggleSidebar} />

            <StyledAside isOpen={isOpen}>
                <TitleMenu>Меню</TitleMenu>
                <StyledNav>
                    <StyledNavList>
                        {NAV_ITEMS.map((item, index) => (
                            <StyledNavListItem key={index}>
                                {item.children && item.children.length > 0
                                    ? renderSubToggle(item, index)
                                    : renderNavLink(item)}
                                {item.children &&
                                    renderSubMenu(item.children, index)}
                            </StyledNavListItem>
                        ))}
                    </StyledNavList>
                </StyledNav>
            </StyledAside>
        </>
    );
};

export default NavBar;

const HamburgerButton = styled.button`
    display: block;
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1002;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
`;

const HamburgerLines = styled.div`
    width: 28px;
    height: 20px;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    span {
        display: block;
        height: 3px;
        width: 100%;
        background-color: ${({ isOpen }) => (isOpen ? "#0070f3" : "#333")};
        border-radius: 3px;
        transition: all 0.3s ease;
        transform-origin: center;
    }

    span:nth-child(1) {
        transform: ${({ isOpen }) =>
            isOpen ? "rotate(45deg) translate(5px, 5px)" : "none"};
    }

    span:nth-child(2) {
        opacity: ${({ isOpen }) => (isOpen ? 0 : 1)};
        transform: ${({ isOpen }) => (isOpen ? "translateX(-10px)" : "none")};
    }

    span:nth-child(3) {
        transform: ${({ isOpen }) =>
            isOpen ? "rotate(-45deg) translate(5px, -5px)" : "none"};
    }
`;

const SidebarOverlay = styled.div`
    display: ${({ isOpen }) => (isOpen ? "block" : "none")};
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 1000;
`;

const StyledAside = styled.aside`
    width: 300px;
    background-color: #f9f9f9;
    box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
    height: 100vh;
    position: fixed;
    top: 0;
    right: 0;
    transform: ${({ isOpen }) =>
        isOpen ? "translateX(0)" : "translateX(100%)"};
    transition: transform 0.2s ease-in-out;
    z-index: 1001;
    text-align: left;
`;

const TitleMenu = styled.h2`
    font-size: 1.5rem;
    margin: 20px;
    color: var(--color-text, #333);
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    padding-bottom: 10px;
`;

const StyledNav = styled.nav`
    padding: 0 20px 20px;
    overflow-y: auto;
    height: calc(100vh - 100px);
    max-height: calc(100vh - 100px);
`;

const StyledNavList = styled.ul`
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 0;
    margin: 0;
    list-style-type: none;
`;

const StyledNavListItem = styled.li``;

const StyledLink = styled(Link)`
    color: var(--color-text, #333);
    text-decoration: none;
    font-size: 1rem;
    padding: 6px 8px;
    border-radius: 6px;
    transition: background-color 0.2s ease, color 0.2s ease;

    &:hover {
        color: var(--color-primary, #0070f3);
        background-color: rgba(0, 112, 243, 0.05);
    }

    &.active {
        font-weight: bold;
        color: var(--color-primary, #0070f3);
        background-color: rgba(0, 112, 243, 0.1);
    }
`;

const StyledExternalLink = styled.a`
    color: var(--color-text, #333);
    text-decoration: none;
    font-size: 1rem;
    padding: 6px 8px;
    border-radius: 6px;
    transition: background-color 0.2s ease, color 0.2s ease;

    &:hover {
        color: var(--color-primary, #0070f3);
        background-color: rgba(0, 112, 243, 0.05);
    }
`;

const SubMenuToggle = styled.button`
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: var(--color-text, #333);
    background: none;
    border: none;
    font-size: 1rem;
    padding: 0 8px;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.2s ease, color 0.2s ease;
    text-align: left;

    &:hover {
        color: var(--color-primary, #0070f3);
        background-color: rgba(0, 112, 243, 0.05);
    }
`;

const ArrowIcon = styled.span`
    font-size: 0.8rem;
    transition: transform 0.2s ease;
    transform: ${({ isOpen }) => (isOpen ? "rotate(180deg)" : "rotate(0deg)")};
`;

const SubMenuList = styled.ul`
    max-height: ${({ isOpen }) => (isOpen ? "300px" : "0")};
    overflow: hidden;
    transition: max-height 0.3s ease;
    padding: 0;
    margin: 0;
    list-style: none;
    margin-left: 16px;
`;

const SubMenuListItem = styled.li`
    margin: 4px 0;
`;
