import bleach

ALLOWED_TAGS = [
    'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3',
    'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'pre', 'code',
    'span', 'div', 'sub', 'sup', 'hr',
]

ALLOWED_ATTRIBUTES = {
    'a': ['href', 'target', 'rel'],
    'img': ['src', 'alt', 'width', 'height'],
}


def sanitize_html(value):
    if not value:
        return value
    return bleach.clean(value, tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRIBUTES, strip=True)
