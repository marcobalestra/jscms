#!/usr/bin/perl -w
my $arg = $ENV{QUERY_STRING};
my $match = $arg =~ m/^.*match=([a-zA-Z0-9._-]+).*/ ? "$1" : '';
my $ext = $arg =~ m/^.*ext=([a-zA-Z0-9._-]+).*/ ? "$1" : '';
if ( $match or $ext ) {
	$match =~ s/\./\\./g;
	$ext =~ s/\./\\./g;
	opendir my $dir, "../../data" or die "Cannot open directory: $!";
	my @files = readdir $dir;
	closedir $dir;
	my @l;
	foreach my $f (@files) {
		next if $d =~ /^\./;
		next if -d $f;
		next if ($match and $f !~ /$match/);
		next if ($ext and $f !~ /\.$ext$/);
		$f =~ s/"/\\"/g;
		push @l,'"'.$f.'"';
	}
	print join(',',@l);
}
print '';
