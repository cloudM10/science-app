import React from "react";
import { Link } from "gatsby";
import styled from "styled-components";
import { getBreadcrumbConfig } from "../config/app-configuration";

const Breadcrumbs = ({ contentType, title }) => {
    // Получаем информацию о секции или используем значения по умолчанию
    const sectionInfo = getBreadcrumbConfig(contentType) || {
        path: "/",
        label: "Головна",
    };

    // JSON-LD структурированные данные для SEO
    const breadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            {
                "@type": "ListItem",
                position: 1,
                name: "Головна",
                item: "/",
            },
            {
                "@type": "ListItem",
                position: 2,
                name: sectionInfo.label,
                item: sectionInfo.path,
            },
            {
                "@type": "ListItem",
                position: 3,
                name: title,
                item: "#",
            },
        ],
    };

    return (
        <BreadcrumbsContainer>
            <script type="application/ld+json">
                {JSON.stringify(breadcrumbJsonLd)}
            </script>
            <BreadcrumbsList>
                <BreadcrumbItem>
                    <BreadcrumbLink to="/">
                        <HomeIcon>🏠</HomeIcon> Головна
                    </BreadcrumbLink>
                </BreadcrumbItem>

                <BreadcrumbSeparator>/</BreadcrumbSeparator>

                <BreadcrumbItem>
                    <BreadcrumbLink to={sectionInfo.path}>
                        {sectionInfo.label}
                    </BreadcrumbLink>
                </BreadcrumbItem>

                <BreadcrumbSeparator>/</BreadcrumbSeparator>

                <BreadcrumbItem>
                    <BreadcrumbCurrent>{title}</BreadcrumbCurrent>
                </BreadcrumbItem>
            </BreadcrumbsList>
        </BreadcrumbsContainer>
    );
};

const BreadcrumbsContainer = styled.nav`
    margin-bottom: var(--size-600);
    padding: var(--size-300) 0;
`;

const BreadcrumbsList = styled.ol`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    list-style: none;
    margin: 0;
    padding: 0;
    font-size: var(--size-300);
`;

const BreadcrumbItem = styled.li`
    display: flex;
    align-items: center;
`;

const BreadcrumbLink = styled(Link)`
    color: var(--color-text-secondary);
    text-decoration: none;
    padding: var(--size-200) var(--size-300);
    border-radius: 4px;
    transition: all 0.2s ease;

    &:hover {
        color: var(--color-primary);
        background-color: rgba(255, 111, 97, 0.1);
        text-decoration: underline;
    }

    &:focus {
        outline: 2px solid var(--color-primary);
        outline-offset: 2px;
    }
`;

const BreadcrumbCurrent = styled.span`
    color: var(--color-text);
    font-weight: 500;
    padding: var(--size-200) var(--size-300);
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    @media (max-width: 768px) {
        max-width: 150px;
    }
`;

const BreadcrumbSeparator = styled.span`
    color: var(--color-text-secondary);
    margin: 0 var(--size-100);
    user-select: none;
`;

const HomeIcon = styled.span`
    font-size: var(--size-300);
    margin-right: var(--size-200);
    display: inline-block;
`;

export default Breadcrumbs;
