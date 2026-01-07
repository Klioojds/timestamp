/**
 * Tests for SafeMessage creation and XSS protection.
 */
import { describe, it, expect } from 'vitest';
import {
  createSafeMessage,
  createSafeMessageFromText,
  MAX_MESSAGE_LENGTH,
  DEFAULT_SAFE_MESSAGE,
} from './index';

describe('createSafeMessage', () => {
  describe('URL decoding', () => {
    it('should decode URL-encoded spaces', () => {
      const msg = createSafeMessage('Hello%20World');
      expect(msg.forTextContent).toBe('Hello World');
    });

    it('should decode URL-encoded special characters', () => {
      const msg = createSafeMessage("Time%27s%20up%21");
      expect(msg.forTextContent).toBe("Time's up!");
    });

    it('should handle malformed URL encoding gracefully', () => {
      const msg = createSafeMessage('%ZZinvalid%encoding');
      expect(msg.forTextContent).toBe('%ZZinvalid%encoding');
    });

    it('should handle already-decoded text', () => {
      const msg = createSafeMessage('Plain text');
      expect(msg.forTextContent).toBe('Plain text');
    });
  });

  describe('XSS protection', () => {
    it('should escape script tags for innerHTML', () => {
      const msg = createSafeMessage('<script>alert(1)</script>');
      expect(msg.forInnerHTML).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
      expect(msg.forTextContent).toBe('<script>alert(1)</script>');
    });

    it('should escape event handlers for innerHTML', () => {
      const msg = createSafeMessage('<img onerror="alert(1)">');
      expect(msg.forInnerHTML).toBe('&lt;img onerror=&quot;alert(1)&quot;&gt;');
    });

    it('should escape ampersands', () => {
      const msg = createSafeMessage('Tom & Jerry');
      expect(msg.forInnerHTML).toBe('Tom &amp; Jerry');
      expect(msg.forTextContent).toBe('Tom & Jerry');
    });

    it('should escape quotes', () => {
      const msg = createSafeMessage('Say "hello"');
      expect(msg.forInnerHTML).toBe('Say &quot;hello&quot;');
      expect(msg.forTextContent).toBe('Say "hello"');
    });

    it('should escape apostrophes', () => {
      const msg = createSafeMessage("It's time");
      expect(msg.forInnerHTML).toBe('It&#39;s time');
      expect(msg.forTextContent).toBe("It's time");
    });

    it('should handle combined XSS attack vectors', () => {
      const msg = createSafeMessage('<script>alert("xss")</script>');
      expect(msg.forInnerHTML).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    });

    it('should handle URL-encoded XSS attempts', () => {
      // URL: <script>alert(1)</script> encoded
      const msg = createSafeMessage('%3Cscript%3Ealert(1)%3C%2Fscript%3E');
      expect(msg.forTextContent).toBe('<script>alert(1)</script>');
      expect(msg.forInnerHTML).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
    });
  });

  describe('truncation', () => {
    it('should truncate messages exceeding max length', () => {
      const longMessage = 'a'.repeat(300);
      const msg = createSafeMessage(longMessage);
      expect(msg.forTextContent.length).toBe(MAX_MESSAGE_LENGTH);
      expect(msg.forInnerHTML.length).toBe(MAX_MESSAGE_LENGTH);
    });

    it('should not truncate messages within limit', () => {
      const shortMessage = 'Hello!';
      const msg = createSafeMessage(shortMessage);
      expect(msg.forTextContent).toBe(shortMessage);
    });
  });

  describe('immutability', () => {
    it('should return a frozen object', () => {
      const msg = createSafeMessage('test');
      expect(Object.isFrozen(msg)).toBe(true);
    });
  });
});

describe('createSafeMessageFromText', () => {
  it('should create SafeMessage from plain text', () => {
    const msg = createSafeMessageFromText("Time's up!");
    expect(msg.forTextContent).toBe("Time's up!");
    expect(msg.forInnerHTML).toBe('Time&#39;s up!');
  });

  it('should escape HTML in plain text', () => {
    const msg = createSafeMessageFromText('<b>Bold</b>');
    expect(msg.forTextContent).toBe('<b>Bold</b>');
    expect(msg.forInnerHTML).toBe('&lt;b&gt;Bold&lt;/b&gt;');
  });

  it('should truncate long messages', () => {
    const longMessage = 'x'.repeat(300);
    const msg = createSafeMessageFromText(longMessage);
    expect(msg.forTextContent.length).toBe(MAX_MESSAGE_LENGTH);
  });
});

describe('DEFAULT_SAFE_MESSAGE', () => {
  it('should have expected default text', () => {
    expect(DEFAULT_SAFE_MESSAGE.forTextContent).toBe('Happy New Year!');
  });

  it('should be frozen', () => {
    expect(Object.isFrozen(DEFAULT_SAFE_MESSAGE)).toBe(true);
  });
});

describe('integration: full URL to display flow', () => {
  it('should handle typical celebration message from URL', () => {
    // Simulate: ?message=Time%27s%20up%21
    const msg = createSafeMessage("Time%27s%20up%21");

    // Theme using textContent (safe)
    expect(msg.forTextContent).toBe("Time's up!");

    // Theme using innerHTML (also safe)
    expect(msg.forInnerHTML).toBe('Time&#39;s up!');
  });

  it('should handle malicious URL parameter', () => {
    // Simulate: ?message=%3Cscript%3Ealert(%27xss%27)%3C%2Fscript%3E
    const msg = createSafeMessage('%3Cscript%3Ealert(%27xss%27)%3C%2Fscript%3E');

    // Both are safe
    expect(msg.forTextContent).toBe("<script>alert('xss')</script>");
    expect(msg.forInnerHTML).toBe('&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;');
  });
});
