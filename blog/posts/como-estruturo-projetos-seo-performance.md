---
title: "Como estruturo projetos Front End para SEO e performance"
description: "Minha checklist prática: semântica, dados estruturados, Core Web Vitals e pipeline de build enxuto."
date: 2025-08-12
tags: ["SEO", "Performance", "Acessibilidade"]
---

Abrir um projeto com **boas bases** economiza horas (e dores de cabeça) depois. Abaixo está meu passo a passo rápido.

## 1) Semântica e acessibilidade
- Estruturo o HTML com landmarks (`header`, `main`, `nav`, `footer`) e títulos em ordem lógica.
- Labels e `aria-*` só quando necessário. Prefiro *semântica nativa*.
- Foco visível com `:focus-visible` e contraste checados.

## 2) Dados estruturados
- Uso `JSON-LD` para `WebSite`, `BreadcrumbList` e, em posts, `BlogPosting`.
- Isso ajuda o Google a entender contexto e exibir rich results.

## 3) Core Web Vitals
- Imagens em formatos eficientes (AVIF/WebP) + `srcset/sizes`.
- Fonte com `font-display: swap` e pré-conexões.
- JS carregado com `defer`/`module` e dividido por rota quando necessário.

## 4) Build e deploy
- Gzip/Brotli sempre ativos.
- Cache longo para assets com hash.
- Preview em PRs para testar CLS/LCP antes de subir.

> O objetivo é simples: **conteúdo acessível, rápido e medido**. Se não mede, não melhora.

```html
<!-- exemplo de pré-conexão útil -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
```
