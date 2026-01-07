# Security Policy

## About This Project

This is a **static client-side website** with no backend, database, or user authentication. The attack surface is limited to:

- Client-side JavaScript execution
- URL parameter handling
- Third-party dependencies

## Supported Versions

This project is maintained by a single individual. Security updates are applied to the latest version on the `main` branch.

| Version | Supported          |
| ------- | ------------------ |
| Latest (main) | :white_check_mark: |
| Older commits | :x: |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly using GitHub's private vulnerability reporting:

1. Go to the [Security tab](https://github.com/chrisreddington/timestamp/security)
2. Click "Report a vulnerability"
3. Provide details about the vulnerability

### What to Include

When reporting a vulnerability, please include:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if you have one)

### Response Timeline

This project is maintained by a single person in their spare time. I'll do my best to respond promptly, but please allow reasonable time for review and fixes. Your patience is appreciated.

## Scope

Given this is a static client-side website, relevant vulnerabilities include:

- Cross-site scripting (XSS) via URL parameters or user input
- Dependency vulnerabilities (critical/high severity)
- GitHub Actions workflow security (secrets exposure, command injection)

Out of scope:

- Issues in third-party dependencies (report to upstream)
- Theoretical vulnerabilities without practical exploit
- Server-side vulnerabilities (there is no server)
- Authentication/authorization issues (there is no auth)

## Disclosure Policy

- We will acknowledge your report as soon as we can
- We will credit you in the fix announcement (if desired)
- Please allow reasonable time to fix the issue before public disclosure

Thank you for helping keep Timestamp secure!
