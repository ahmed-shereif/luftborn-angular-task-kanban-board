import { TestBed } from '@angular/core/testing';
import { UserAvatar } from './user-avatar';

describe('UserAvatar', () => {
  function create(user: { name: string; avatar?: string }) {
    const fixture = TestBed.createComponent(UserAvatar);
    fixture.componentRef.setInput('user', user);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('treats an http(s) avatar value as an image URL', () => {
    const cmp = create({ name: 'Jane Doe', avatar: 'https://example.com/a.png' });
    expect(cmp.imageUrl()).toBe('https://example.com/a.png');
  });

  it('treats a protocol-relative avatar value as an image URL', () => {
    const cmp = create({ name: 'Jane Doe', avatar: '//example.com/a.png' });
    expect(cmp.imageUrl()).toBe('//example.com/a.png');
  });

  it('does not treat plain text as an image URL', () => {
    const cmp = create({ name: 'Jane Doe', avatar: 'JD' });
    expect(cmp.imageUrl()).toBeUndefined();
  });

  it('uses the plain-text avatar (uppercased) as initials when not a URL', () => {
    const cmp = create({ name: 'Jane Doe', avatar: 'jd' });
    expect(cmp.initials()).toBe('JD');
  });

  it('derives initials from the first two words of the name when there is no avatar', () => {
    const cmp = create({ name: 'jane marie doe' });
    expect(cmp.initials()).toBe('JM');
  });

  it('derives initials from a single-word name', () => {
    const cmp = create({ name: 'Cher' });
    expect(cmp.initials()).toBe('C');
  });

  it('derives initials from the name when the avatar is an image URL', () => {
    const cmp = create({ name: 'Jane Doe', avatar: 'https://example.com/a.png' });
    expect(cmp.initials()).toBe('JD');
  });

  it('defaults size to "md"', () => {
    const cmp = create({ name: 'Jane Doe' });
    expect(cmp.size()).toBe('md');
  });
});
