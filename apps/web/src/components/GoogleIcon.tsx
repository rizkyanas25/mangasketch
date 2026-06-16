interface GoogleIconProps {
  className?: string;
}

const GOOGLE_ICON_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAhklEQVR4nGNgGAWjgATwRE7/P7F4+DjgCQmW0sQxTwbKAU+oYDFFDnlCpkFD3wF/DjH+R8fkxiVZ+v4MRgcw0BP8GYoOUEud/59YPOoABlo4ABugqgMmHvQG45HhABiAWYqMGQbaAROJcBC6GpItHjQOIMUhpDpyaDkAGQyYxYPGAaNgWAIAkyzsbJuj7JIAAAAASUVORK5CYII=';

export function GoogleIcon({ className }: GoogleIconProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={GOOGLE_ICON_BASE64}
      alt=''
      className={className}
      draggable={false}
    />
  );
}
