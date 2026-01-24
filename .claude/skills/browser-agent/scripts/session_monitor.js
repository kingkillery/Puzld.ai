// Session Health Monitor
// Detects session state, timeout risks, and authentication issues
// Execute via javascript_tool before critical operations

(function() {
    const result = {
        timestamp: new Date().toISOString(),
        url: window.location.href,
        sessionHealth: 'unknown',
        issues: [],
        recommendations: []
    };

    // Check for login/auth page indicators
    const onLoginPage = checkLoginPage();
    const hasSessionWarning = checkSessionWarning();
    const hasAuthTokens = checkAuthTokens();
    const sessionAge = estimateSessionAge();

    // Evaluate session health
    if (onLoginPage) {
        result.sessionHealth = 'expired';
        result.issues.push('Currently on login page - session expired or not authenticated');
        result.recommendations.push('Re-authenticate before proceeding');
    } else if (hasSessionWarning) {
        result.sessionHealth = 'warning';
        result.issues.push('Session timeout warning detected');
        result.recommendations.push('Refresh session or save work immediately');
    } else if (!hasAuthTokens && requiresAuth()) {
        result.sessionHealth = 'suspicious';
        result.issues.push('No authentication tokens found but page appears to require auth');
        result.recommendations.push('Verify authentication state before critical operations');
    } else if (sessionAge && sessionAge > 25) {
        result.sessionHealth = 'aging';
        result.issues.push(`Session appears to be ${sessionAge}+ minutes old`);
        result.recommendations.push('Consider refreshing session before long operations');
    } else {
        result.sessionHealth = 'healthy';
        result.recommendations.push('Session appears healthy - proceed with operations');
    }

    // Portal-specific checks
    const portalChecks = runPortalSpecificChecks();
    if (portalChecks.issues.length > 0) {
        result.issues.push(...portalChecks.issues);
        result.recommendations.push(...portalChecks.recommendations);
        if (portalChecks.overrideHealth) {
            result.sessionHealth = portalChecks.overrideHealth;
        }
    }

    // Add diagnostic data
    result.diagnostics = {
        onLoginPage,
        hasSessionWarning,
        hasAuthTokens,
        sessionAgeMinutes: sessionAge,
        cookies: document.cookie.length > 0,
        localStorage: Object.keys(localStorage).length,
        sessionStorage: Object.keys(sessionStorage).length
    };

    return JSON.stringify(result, null, 2);

    // Helper functions

    function checkLoginPage() {
        const url = window.location.href.toLowerCase();
        const loginIndicators = [
            '/login', '/signin', '/auth', '/sso', '/oauth',
            'login.', 'signin.', 'auth.', 'identity.'
        ];

        if (loginIndicators.some(ind => url.includes(ind))) {
            return true;
        }

        // Check for login form on page
        const hasLoginForm = document.querySelector(
            'form[action*="login"], form[action*="signin"], ' +
            'input[type="password"], ' +
            '[class*="login-form"], [class*="signin-form"], ' +
            '[id*="login-form"], [id*="signin-form"]'
        );

        return !!hasLoginForm;
    }

    function checkSessionWarning() {
        const warningSelectors = [
            '[class*="session-timeout"]',
            '[class*="session-expired"]',
            '[class*="timeout-warning"]',
            '[class*="session-warning"]',
            '.modal:not([style*="none"]) [class*="session"]',
            '[role="alert"][class*="session"]'
        ];

        for (const selector of warningSelectors) {
            const el = document.querySelector(selector);
            if (el && isVisible(el)) {
                return true;
            }
        }

        // Check for warning text patterns
        const bodyText = document.body?.innerText?.toLowerCase() || '';
        const warningPatterns = [
            'session will expire',
            'session is about to expire',
            'you will be logged out',
            'inactivity timeout',
            'session timeout'
        ];

        return warningPatterns.some(pattern => bodyText.includes(pattern));
    }

    function checkAuthTokens() {
        // Check cookies for auth indicators
        const cookies = document.cookie.toLowerCase();
        const authCookiePatterns = [
            'session', 'auth', 'token', 'sid', 'jwt',
            'access_token', 'id_token', 'refresh'
        ];

        const hasCookies = authCookiePatterns.some(pattern => cookies.includes(pattern));

        // Check localStorage/sessionStorage
        let hasStorage = false;
        try {
            const storageKeys = [
                ...Object.keys(localStorage),
                ...Object.keys(sessionStorage)
            ].map(k => k.toLowerCase());

            hasStorage = authCookiePatterns.some(pattern =>
                storageKeys.some(key => key.includes(pattern))
            );
        } catch (e) {
            // Storage access denied
        }

        return hasCookies || hasStorage;
    }

    function estimateSessionAge() {
        // Try to find session timestamp in storage
        try {
            const keys = [...Object.keys(sessionStorage), ...Object.keys(localStorage)];
            for (const key of keys) {
                if (key.toLowerCase().includes('timestamp') || key.toLowerCase().includes('login')) {
                    const value = sessionStorage.getItem(key) || localStorage.getItem(key);
                    const timestamp = parseInt(value) || Date.parse(value);
                    if (timestamp) {
                        const ageMs = Date.now() - timestamp;
                        return Math.floor(ageMs / 60000); // Convert to minutes
                    }
                }
            }
        } catch (e) {
            // Storage access denied
        }
        return null;
    }

    function requiresAuth() {
        const url = window.location.href.toLowerCase();
        const publicPatterns = ['/public', '/home', '/about', '/contact', '/help'];
        return !publicPatterns.some(pattern => url.includes(pattern));
    }

    function isVisible(el) {
        if (!el) return false;
        const style = window.getComputedStyle(el);
        return style.display !== 'none' &&
               style.visibility !== 'hidden' &&
               style.opacity !== '0';
    }

    function runPortalSpecificChecks() {
        const url = window.location.href;
        const issues = [];
        const recommendations = [];
        let overrideHealth = null;

        if (url.includes('albatross.myblueraven.com')) {
            // Albatross-specific checks
            const hasContent = document.querySelector('.main-content, .project-content, .queue-content');
            if (!hasContent && !onLoginPage) {
                issues.push('Albatross main content not found - may be loading or session issue');
                recommendations.push('Wait 3 seconds and check again');
            }
        }

        if (url.includes('salesforce.com') || url.includes('lightning.force.com')) {
            // Salesforce-specific checks
            const hasLightning = document.querySelector('.oneContent, .slds-page-header');
            const hasSetupMenu = document.querySelector('.setupMenu, .setup-tree');

            if (!hasLightning && !hasSetupMenu && !onLoginPage) {
                issues.push('Salesforce Lightning components not found - may still be loading');
                recommendations.push('Wait 5 seconds for Lightning to fully load');
            }

            // Check for session fork warning
            if (document.querySelector('[class*="session-fork"], [class*="duplicate-session"]')) {
                issues.push('Salesforce session fork detected - multiple sessions may conflict');
                recommendations.push('Close other Salesforce tabs or choose one session');
                overrideHealth = 'warning';
            }
        }

        if (url.includes('powerclerk.com')) {
            // PowerClerk-specific checks
            const hasApp = document.querySelector('.application-form, .dashboard, .portal-content');
            if (!hasApp && !onLoginPage) {
                issues.push('PowerClerk application content not found');
                recommendations.push('Verify correct utility portal and wait for load');
            }
        }

        return { issues, recommendations, overrideHealth };
    }
})();
