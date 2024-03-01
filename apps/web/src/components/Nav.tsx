import {
  Image,
  Link,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
} from '@nextui-org/react';
import { ThemeSwitcher } from './ThemeSwitcher';
import { GitHubIcon } from './GitHubIcon';
import { useLocation } from 'react-router-dom';

const navbarItemLink = [
  {
    href: '/feeds',
    name: '公众号源',
  },
  {
    href: '/accounts',
    name: '账号管理',
  },
  // {
  //   href: '/settings',
  //   name: '设置',
  // },
];

const Nav = () => {
  const { pathname } = useLocation();

  return (
    <div>
      <Navbar isBordered>
        <NavbarBrand>
          <Image
            width={28}
            alt="WeWe RSS"
            className="mr-2"
            src="https://r2-assets.111965.xyz/wewe-rss.png"
          ></Image>
          <p className="font-bold text-inherit">WeWe RSS</p>
        </NavbarBrand>
        <NavbarContent className="hidden sm:flex gap-4" justify="center">
          {navbarItemLink.map((item) => {
            return (
              <NavbarItem
                isActive={pathname.startsWith(item.href)}
                key={item.href}
              >
                <Link color="foreground" href={item.href}>
                  {item.name}
                </Link>
              </NavbarItem>
            );
          })}
        </NavbarContent>
        <NavbarContent justify="end">
          <ThemeSwitcher></ThemeSwitcher>
          <Link
            href="https://github.com/cooderl/wewe-rss"
            target="_blank"
            color="foreground"
          >
            <GitHubIcon />
          </Link>
        </NavbarContent>
      </Navbar>
    </div>
  );
};

export default Nav;
