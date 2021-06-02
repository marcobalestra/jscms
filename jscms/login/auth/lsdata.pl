#!/usr/bin/perl -w
my $arg = $ENV{QUERY_STRING};
my $match = $arg =~ m/^.*match=([a-zA-Z0-9._-]+).*/ ? "$1" : '';
my $ext = $arg =~ m/^.*ext=([a-zA-Z0-9._-]+).*/ ? "$1" : 'json';
my $relpath = $arg =~ m,^.*dir=([a-zA-Z0-9/._-]+).*, ? "$1" : '';
$match =~ s/\./\\./g;
$ext =~ s/\./\\./g;
my $path = "../../data";
if ( $relpath and $relpath !~ /\.{2}/ and $relpath !~ m,^/, ) {
	$path .= "/$relpath";
	$path =~ s,/$,,;
}
opendir my $dir, $path or die "Cannot open directory: $!";
my @files = readdir $dir;
closedir $dir;
my @l;
foreach my $f (@files) {
	next if $f =~ /^\./;
	next if -d "$path/$f";
	next if ($match and $f !~ /$match/);
	next if ($ext and $f !~ /\.$ext$/);
	$f =~ s/"/\\"/g;
	push @l,'"'.$f.'"';
}
print join(',',@l);
